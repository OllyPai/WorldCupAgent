import json

from langchain_core.messages import AIMessage, ToolMessage

from agent import SYSTEM_PROMPT, WORLD_CUP_TOOLS, chat_with_agent
from tools import query_match_detail, query_player_stats, query_players, query_schedule


class FakeAgent:
    def __init__(self, messages=None, error=None):
        self.messages = messages or []
        self.error = error
        self.last_input = None

    def invoke(self, agent_input):
        self.last_input = agent_input
        if self.error:
            raise self.error
        return {"messages": self.messages}


def test_direct_answer_keeps_history_and_returns_contract():
    fake_agent = FakeAgent(messages=[AIMessage(content="你好，我可以查询世界杯数据。")])
    history = [{"role": "user", "content": "你好"}]

    result = chat_with_agent("你能做什么？", history, agent=fake_agent)

    assert result == {
        "answer": "你好，我可以查询世界杯数据。",
        "tool_calls": [],
        "error": None,
    }
    assert fake_agent.last_input["messages"] == [
        {"role": "user", "content": "你好"},
        {"role": "user", "content": "你能做什么？"},
    ]
    assert history == [{"role": "user", "content": "你好"}]


def test_schedule_tool_call_uses_stable_formatter_for_frontend():
    tool_result = {
        "success": True,
        "data": {"team": "巴西", "matches": [{"opponent": "示例队 A"}]},
        "error": None,
    }
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_schedule",
                        "args": {"team": "巴西"},
                        "id": "call-1",
                        "type": "tool_call",
                    }
                ],
            ),
            ToolMessage(
                content=json.dumps(tool_result, ensure_ascii=False),
                tool_call_id="call-1",
                name="query_schedule",
            ),
            AIMessage(content="根据当前数据库，巴西队有一条相关赛程记录。"),
        ]
    )

    result = chat_with_agent("查询巴西队赛程", agent=fake_agent)

    assert "赛程查询结果" in result["answer"]
    assert "巴西" in result["answer"]
    assert "根据当前数据库，巴西队有一条相关赛程记录。" not in result["answer"]
    assert result["error"] is None
    assert result["tool_calls"][0]["tool"] == "query_schedule"
    assert result["tool_calls"][0]["input"] == {"team": "巴西"}
    assert result["tool_calls"][0]["status"] == "success"
    assert "巴西" in result["tool_calls"][0]["summary"]


def test_tool_call_without_final_answer_uses_formatter_fallback():
    tool_result = {
        "success": True,
        "data": {"player_name": "梅西", "team": "阿根廷", "goals": 8},
        "error": None,
    }
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_player_stats",
                        "args": {"player_name": "梅西"},
                        "id": "call-1",
                        "type": "tool_call",
                    }
                ],
            ),
            ToolMessage(
                content=json.dumps(tool_result, ensure_ascii=False),
                tool_call_id="call-1",
                name="query_player_stats",
            ),
        ]
    )

    result = chat_with_agent("查询梅西数据", agent=fake_agent)

    assert "球员数据查询结果" in result["answer"]
    assert "梅西" in result["answer"]
    assert "进球：8" in result["answer"]


def test_single_player_stats_uses_formatter_to_avoid_extra_facts():
    tool_result = {
        "success": True,
        "data": {
            "player_name": "C罗",
            "team": "葡萄牙",
            "goals": 4,
            "assists": 1,
            "appearances": 5,
        },
        "error": None,
    }
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_player_stats",
                        "args": {"player_name": "C罗"},
                        "id": "call-1",
                        "type": "tool_call",
                    }
                ],
            ),
            ToolMessage(
                content=json.dumps(tool_result, ensure_ascii=False),
                tool_call_id="call-1",
                name="query_player_stats",
            ),
            AIMessage(content="C罗（克里斯蒂亚诺·罗纳尔多）在本届世界杯打进4球。"),
        ]
    )

    result = chat_with_agent("C罗的数据", agent=fake_agent)

    assert "球员数据查询结果（当前数据库）" in result["answer"]
    assert "球员：C罗" in result["answer"]
    assert "克里斯蒂亚诺·罗纳尔多" not in result["answer"]


def test_multiple_tool_calls_are_converted_for_frontend():
    schedule_result = {
        "success": True,
        "data": [{"home_team": "阿根廷", "away_team": "佛得角"}],
        "error": None,
    }
    player_result = {
        "success": True,
        "data": {"player_name": "梅西", "goals": 7},
        "error": None,
    }
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_schedule",
                        "args": {"team": "阿根廷"},
                        "id": "call-1",
                        "type": "tool_call",
                    },
                    {
                        "name": "query_player_stats",
                        "args": {"player_name": "梅西"},
                        "id": "call-2",
                        "type": "tool_call",
                    },
                ],
            ),
            ToolMessage(
                content=json.dumps(schedule_result, ensure_ascii=False),
                tool_call_id="call-1",
                name="query_schedule",
            ),
            ToolMessage(
                content=json.dumps(player_result, ensure_ascii=False),
                tool_call_id="call-2",
                name="query_player_stats",
            ),
            AIMessage(content="已查询阿根廷赛程和梅西数据。"),
        ]
    )

    result = chat_with_agent("查询阿根廷赛程和梅西数据", agent=fake_agent)

    assert "赛程查询结果（当前数据库）" in result["answer"]
    assert "球员数据查询结果（当前数据库）" in result["answer"]
    assert "已查询阿根廷赛程和梅西数据。" not in result["answer"]
    assert [call["tool"] for call in result["tool_calls"]] == [
        "query_schedule",
        "query_player_stats",
    ]
    assert [call["status"] for call in result["tool_calls"]] == [
        "success",
        "success",
    ]


def test_agent_error_is_returned_instead_of_raised():
    fake_agent = FakeAgent(error=RuntimeError("模型服务暂时不可用"))

    result = chat_with_agent("查询赛程", agent=fake_agent)

    assert result["answer"] == "当前无法完成请求，请稍后重试。"
    assert result["tool_calls"] == []
    assert result["error"] == "模型服务暂时不可用"


def test_structured_tool_error_is_preserved():
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_schedule",
                        "args": {"team": "不存在队"},
                        "id": "call-2",
                        "type": "tool_call",
                    }
                ],
            ),
            ToolMessage(
                content=json.dumps(
                    {
                        "success": False,
                        "data": None,
                        "error": "没有找到球队：不存在队",
                    },
                    ensure_ascii=False,
                ),
                tool_call_id="call-2",
                name="query_schedule",
            ),
            AIMessage(content="没有找到这支球队。"),
        ]
    )

    result = chat_with_agent("查询不存在队的赛程", agent=fake_agent)

    assert result["tool_calls"][0]["status"] == "error"
    assert result["tool_calls"][0]["summary"] == "没有找到球队：不存在队"
    assert result["answer"] == "赛程查询失败：没有找到球队：不存在队"


def test_agent_synthesis_can_compare_current_tool_result_with_history():
    tool_result = {
        "success": True,
        "data": {
            "player_name": "姆巴佩",
            "team": "法国",
            "goals": 7,
            "assists": 2,
            "appearances": 5,
        },
        "error": None,
    }
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_player_stats",
                        "args": {"player_name": "姆巴佩"},
                        "id": "call-1",
                        "type": "tool_call",
                    }
                ],
            ),
            ToolMessage(
                content=json.dumps(tool_result, ensure_ascii=False),
                tool_call_id="call-1",
                name="query_player_stats",
            ),
            AIMessage(content="根据当前数据库，C罗进球4个，姆巴佩进球7个，因此姆巴佩进球更多。"),
        ]
    )
    history = [
        {"role": "user", "content": "C罗的数据"},
        {
            "role": "assistant",
            "content": "球员数据查询结果：\n- 球员：C罗\n- 进球：4",
        },
    ]

    result = chat_with_agent("他和姆巴佩谁进球多", history, agent=fake_agent)

    assert result["answer"] == "根据当前数据库，C罗进球4个，姆巴佩进球7个，因此姆巴佩进球更多。"
    assert fake_agent.last_input["messages"] == [
        *history,
        {"role": "user", "content": "他和姆巴佩谁进球多"},
    ]


def test_unsupported_inference_falls_back_to_tool_formatting():
    china_result = {
        "success": False,
        "data": None,
        "error": "未查询到符合条件的赛程信息，请检查关键词是否正确。",
    }
    cape_verde_result = {
        "success": True,
        "data": [
            {
                "match_date": "2026-07-04",
                "match_time": "06:00",
                "home_team": "阿根廷",
                "away_team": "佛得角",
                "stage": "1/16决赛",
                "home_score": 3,
                "away_score": 2,
            }
        ],
        "error": None,
    }
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_schedule",
                        "args": {"team": "中国"},
                        "id": "call-1",
                        "type": "tool_call",
                    },
                    {
                        "name": "query_schedule",
                        "args": {"team": "佛得角"},
                        "id": "call-2",
                        "type": "tool_call",
                    },
                ],
            ),
            ToolMessage(
                content=json.dumps(china_result, ensure_ascii=False),
                tool_call_id="call-1",
                name="query_schedule",
            ),
            ToolMessage(
                content=json.dumps(cape_verde_result, ensure_ascii=False),
                tool_call_id="call-2",
                name="query_schedule",
            ),
            AIMessage(content="中国队可能未参加或未晋级；佛得角小组出线后惜败阿根廷，止步1/16决赛。"),
        ]
    )

    result = chat_with_agent("请分别查询中国和佛得角的比赛", agent=fake_agent)

    assert "赛程查询失败" in result["answer"]
    assert "赛程查询结果（当前数据库）" in result["answer"]
    assert "佛得角" in result["answer"]
    assert "可能未参加" not in result["answer"]
    assert "未晋级" not in result["answer"]
    assert "出线" not in result["answer"]
    assert "止步" not in result["answer"]
    assert "惜败" not in result["answer"]


def test_matchup_detail_request_bypasses_agent_and_uses_match_detail_tool():
    fake_agent = FakeAgent()

    result = chat_with_agent("请查询中国和佛得角的比赛详情", agent=fake_agent)

    assert result["answer"].startswith("比赛详情查询失败")
    assert result["tool_calls"] == [
        {
            "tool": "query_match_detail",
            "input": {"home_team": "中国", "away_team": "佛得角"},
            "status": "error",
            "summary": "未找到对应比赛，请检查输入信息。",
        }
    ]
    assert fake_agent.last_input is None


def test_matchup_detail_tool_supports_reverse_team_order():
    fake_agent = FakeAgent()

    result = chat_with_agent("请查询佛得角和阿根廷的比赛详情", agent=fake_agent)

    assert "比赛详情查询结果（当前数据库）" in result["answer"]
    assert "阿根廷 3:2 佛得角" in result["answer"]
    assert result["tool_calls"][0]["tool"] == "query_match_detail"
    assert result["tool_calls"][0]["status"] == "success"
    assert fake_agent.last_input is None


def test_ambiguous_player_evaluation_does_not_call_agent():
    fake_agent = FakeAgent()

    result = chat_with_agent("谁是最强球员", agent=fake_agent)

    assert "需要先明确评价标准" in result["answer"]
    assert "进球、助攻或出场次数" in result["answer"]
    assert result["tool_calls"] == []
    assert result["error"] is None
    assert fake_agent.last_input is None


def test_empty_input_does_not_call_agent():
    fake_agent = FakeAgent()

    result = chat_with_agent("   ", agent=fake_agent)

    assert result["answer"] == "请输入你的问题。"
    assert result["tool_calls"] == []
    assert result["error"] == "user_input 不能为空"
    assert fake_agent.last_input is None


def test_low_information_input_does_not_call_agent():
    fake_agent = FakeAgent()

    result = chat_with_agent("???###", agent=fake_agent)

    assert result["answer"] == "请输入明确的世界杯查询问题，例如：请查询巴西队赛程。"
    assert result["tool_calls"] == []
    assert result["error"] == "invalid_input"
    assert fake_agent.last_input is None


def test_obviously_unsupported_query_does_not_call_agent():
    fake_agent = FakeAgent()

    result = chat_with_agent("帮我写一段 C++ 排序代码", agent=fake_agent)

    assert "当前系统主要支持世界杯赛程查询" in result["answer"]
    assert result["tool_calls"] == []
    assert result["error"] == "unsupported_query"
    assert fake_agent.last_input is None


def test_agent_registers_four_world_cup_tools():
    tool_names = {tool.name for tool in WORLD_CUP_TOOLS}

    assert tool_names == {
        "query_schedule",
        "query_player_stats",
        "query_players",
        "query_match_detail",
    }


def test_system_prompt_limits_answer_to_tool_results():
    assert "工具返回是唯一事实来源" in SYSTEM_PROMPT
    assert "不要补充背景知识" in SYSTEM_PROMPT
    assert "不得根据赛程自行推断" in SYSTEM_PROMPT
    assert "只有用户明确说“分别”或“各自”" in SYSTEM_PROMPT
    assert "球员排行" in SYSTEM_PROMPT
    assert "当前数据来自系统数据库" in SYSTEM_PROMPT


def test_real_tools_return_standard_contract():
    results = [
        query_schedule.invoke({"team": "阿根廷"}),
        query_player_stats.invoke({"player_name": "梅西"}),
        query_players.invoke({"sort_by": "goals", "limit": 1}),
        query_match_detail.invoke({"home_team": "阿根廷", "away_team": "佛得角"}),
    ]

    for result in results:
        assert set(result) == {"success", "data", "error"}
        assert result["success"] is True
        assert result["data"]
        assert result["error"] is None


def test_real_tool_error_keeps_standard_contract():
    result = query_player_stats.invoke({"player_name": "不存在球员"})

    assert set(result) == {"success", "data", "error"}
    assert result["success"] is False
    assert result["data"] is None
    assert "未查询到球员" in result["error"]


def test_real_query_players_returns_goal_ranking():
    result = query_players.invoke({"sort_by": "goals", "limit": 3})

    assert result["success"] is True
    assert result["error"] is None
    players = result["data"]["players"]
    assert len(players) == 3
    assert players[0]["goals"] >= players[1]["goals"] >= players[2]["goals"]
    assert result["data"]["sort_by"] == "goals"
