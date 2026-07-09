import json

from langchain_core.messages import AIMessage, ToolMessage

from agent import SYSTEM_PROMPT, WORLD_CUP_TOOLS, chat_with_agent
from tools import (
    query_best_goalkeeper,
    query_match_detail,
    query_player_stats,
    query_players,
    query_schedule,
    query_top10_scorers,
    query_top_scorer_by_team,
)


def fake_tool_agent(tool_name, args, data, final_answer=""):
    return FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": tool_name,
                        "args": args,
                        "id": "call-1",
                        "type": "tool_call",
                    }
                ],
            ),
            ToolMessage(
                content=json.dumps(
                    {"success": True, "data": data, "error": None},
                    ensure_ascii=False,
                ),
                tool_call_id="call-1",
                name=tool_name,
            ),
            AIMessage(content=final_answer),
        ]
    )


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
        "result_payload": None,
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
    assert result["result_payload"] is None


def test_result_payload_supports_all_registered_tool_shapes():
    cases = [
        (
            "query_schedule",
            {"team": "巴西"},
            [
                {
                    "match_date": "2026-06-14",
                    "match_time": "06:00",
                    "stage": "小组赛C组",
                    "home_team": "巴西",
                    "away_team": "摩洛哥",
                    "home_score": 1,
                    "away_score": 1,
                }
            ],
            "schedule",
            "巴西",
        ),
        (
            "query_player_stats",
            {"player_name": "梅西"},
            {
                "player_name": "梅西",
                "team": "阿根廷",
                "goals": 8,
                "assists": 3,
                "appearances": 5,
            },
            "player",
            "梅西",
        ),
        (
            "query_players",
            {"sort_by": "goals", "limit": 2},
            {
                "players": [
                    {
                        "player_name": "梅西",
                        "team": "阿根廷",
                        "goals": 8,
                        "assists": 3,
                        "appearances": 5,
                    }
                ],
                "sort_by": "goals",
            },
            "player_ranking",
            "梅西",
        ),
        (
            "query_match_detail",
            {"home_team": "阿根廷", "away_team": "佛得角"},
            {
                "match_id": 87,
                "match_date": "2026-07-04",
                "match_time": "06:00",
                "stage": "1/16决赛",
                "home_team": "阿根廷",
                "away_team": "佛得角",
                "home_score": 3,
                "away_score": 2,
                "goals": [],
            },
            "match_detail",
            "阿根廷",
        ),
        (
            "query_top_scorer_by_team",
            {"team": "阿根廷"},
            {
                "team": "阿根廷",
                "top_scorer": {
                    "player_name": "梅西",
                    "team": "阿根廷",
                    "goals": 8,
                    "assists": 3,
                    "appearances": 5,
                },
            },
            "player",
            "梅西",
        ),
        (
            "query_best_goalkeeper",
            {},
            {
                "best_goalkeeper": {
                    "player_name": "门将A",
                    "team": "阿根廷",
                    "saves": 12,
                    "save_rate": "80%",
                }
            },
            "goalkeeper",
            "门将A",
        ),
        (
            "query_top10_scorers",
            {},
            {
                "top10_scorers": [
                    {
                        "player_name": "梅西",
                        "team": "阿根廷",
                        "goals": 8,
                        "assists": 3,
                        "appearances": 5,
                    }
                ]
            },
            "player_ranking",
            "梅西",
        ),
    ]

    for tool_name, args, data, expected_mode, expected_text in cases:
        result = chat_with_agent(
            f"测试 {tool_name}",
            agent=fake_tool_agent(tool_name, args, data),
        )

        payload = result["result_payload"]
        assert payload["mode"] == expected_mode
        assert payload["source_tools"] == [tool_name]
        assert payload["title"]
        assert payload["summary"]
        assert expected_text in json.dumps(payload["data"], ensure_ascii=False)


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
    assert result["result_payload"]["mode"] == "schedule"
    assert result["result_payload"]["source_tools"] == ["query_schedule"]
    assert result["result_payload"]["data"] == cape_verde_result["data"]


def test_multiple_player_stats_build_player_comparison_payload():
    messi_result = {
        "success": True,
        "data": {
            "player_name": "梅西",
            "team": "阿根廷",
            "goals": 8,
            "assists": 3,
            "appearances": 5,
        },
        "error": None,
    }
    mbappe_result = {
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
                        "args": {"player_name": "梅西"},
                        "id": "call-1",
                        "type": "tool_call",
                    },
                    {
                        "name": "query_player_stats",
                        "args": {"player_name": "姆巴佩"},
                        "id": "call-2",
                        "type": "tool_call",
                    },
                ],
            ),
            ToolMessage(
                content=json.dumps(messi_result, ensure_ascii=False),
                tool_call_id="call-1",
                name="query_player_stats",
            ),
            ToolMessage(
                content=json.dumps(mbappe_result, ensure_ascii=False),
                tool_call_id="call-2",
                name="query_player_stats",
            ),
            AIMessage(content="梅西和姆巴佩的数据对比。"),
        ]
    )

    result = chat_with_agent("比较梅西和姆巴佩", agent=fake_agent)

    assert result["result_payload"] == {
        "mode": "player_comparison",
        "title": "球员数据对比",
        "summary": "共 2 名球员，数据来自当前数据库。",
        "source_tools": ["query_player_stats", "query_player_stats"],
        "data": [
            {
                "player_name": "梅西",
                "team": "阿根廷",
                "goals": 8,
                "assists": 3,
                "appearances": 5,
            },
            {
                "player_name": "姆巴佩",
                "team": "法国",
                "goals": 7,
                "assists": 2,
                "appearances": 5,
            },
        ],
    }


def test_all_failed_tool_calls_keep_result_payload_null():
    fake_agent = FakeAgent(
        messages=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_match_detail",
                        "args": {"home_team": "中国", "away_team": "佛得角"},
                        "id": "call-1",
                        "type": "tool_call",
                    }
                ],
            ),
            ToolMessage(
                content=json.dumps(
                    {
                        "success": False,
                        "data": None,
                        "error": "未找到对应比赛，请检查输入信息。",
                    },
                    ensure_ascii=False,
                ),
                tool_call_id="call-1",
                name="query_match_detail",
            ),
        ]
    )

    result = chat_with_agent("中国和佛得角的比赛详情", agent=fake_agent)

    assert result["answer"].startswith("比赛详情查询失败")
    assert result["result_payload"] is None


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
    assert result["result_payload"] is None
    assert fake_agent.last_input is None


def test_matchup_detail_tool_supports_reverse_team_order():
    fake_agent = FakeAgent()

    result = chat_with_agent("请查询佛得角和阿根廷的比赛详情", agent=fake_agent)

    assert "比赛详情查询结果（当前数据库）" in result["answer"]
    assert "阿根廷 3:2 佛得角" in result["answer"]
    assert result["tool_calls"][0]["tool"] == "query_match_detail"
    assert result["tool_calls"][0]["status"] == "success"
    assert result["result_payload"]["mode"] == "match_detail"
    assert result["result_payload"]["source_tools"] == ["query_match_detail"]
    assert result["result_payload"]["data"]["home_team"] == "阿根廷"
    assert result["result_payload"]["data"]["away_team"] == "佛得角"
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


def test_agent_registers_world_cup_tools():
    tool_names = {tool.name for tool in WORLD_CUP_TOOLS}

    assert tool_names == {
        "query_schedule",
        "query_player_stats",
        "query_players",
        "query_match_detail",
        "query_top_scorer_by_team",
        "query_best_goalkeeper",
        "query_top10_scorers",
    }


def test_system_prompt_limits_answer_to_tool_results():
    assert "工具返回是唯一事实来源" in SYSTEM_PROMPT
    assert "不要补充背景知识" in SYSTEM_PROMPT
    assert "不得根据赛程自行推断" in SYSTEM_PROMPT
    assert "只有用户明确说“分别”或“各自”" in SYSTEM_PROMPT
    assert "门将扑救" in SYSTEM_PROMPT
    assert "球员排行" in SYSTEM_PROMPT
    assert "当前数据来自系统数据库" in SYSTEM_PROMPT


def test_real_tools_return_standard_contract():
    results = [
        query_schedule.invoke({"team": "阿根廷"}),
        query_player_stats.invoke({"player_name": "梅西"}),
        query_players.invoke({"sort_by": "goals", "limit": 1}),
        query_match_detail.invoke({"home_team": "阿根廷", "away_team": "佛得角"}),
        query_top_scorer_by_team.invoke({"team": "阿根廷"}),
        query_best_goalkeeper.invoke({}),
        query_top10_scorers.invoke({}),
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


def test_player_aliases_keep_common_names_working():
    result = query_player_stats.invoke({"player_name": "梅西"})

    assert result["success"] is True
    assert result["data"]["player_name"] == "利昂内尔・梅西"
    assert result["data"]["goals"] == 8


def test_match_detail_goal_fallback_keeps_cristiano_ronaldo_query_working():
    result = query_player_stats.invoke({"player_name": "C罗"})

    assert result["success"] is True
    assert result["data"]["player_name"] == "C罗"
    assert result["data"]["team"] == "葡萄牙"
    assert result["data"]["goals"] >= 1


def test_real_business_tools_return_rankings():
    top_scorer = query_top_scorer_by_team.invoke({"team": "阿根廷"})
    best_goalkeeper = query_best_goalkeeper.invoke({})
    top10 = query_top10_scorers.invoke({})

    assert top_scorer["success"] is True
    assert top_scorer["data"]["top_scorer"]["team"] == "阿根廷"
    assert best_goalkeeper["success"] is True
    assert best_goalkeeper["data"]["best_goalkeeper"]["saves"] >= 1
    assert top10["success"] is True
    assert len(top10["data"]["top10_scorers"]) == 10
