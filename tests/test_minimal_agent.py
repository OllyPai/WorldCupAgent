import json

from langchain_core.messages import AIMessage, ToolMessage

from agent import SYSTEM_PROMPT, WORLD_CUP_TOOLS, chat_with_agent
from tools import query_match_detail, query_player_stats, query_schedule


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


def test_tool_call_is_converted_for_frontend():
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
            AIMessage(content="巴西队有两场示例赛程，并且已经小组头名出线。"),
        ]
    )

    result = chat_with_agent("查询巴西队赛程", agent=fake_agent)

    assert "赛程查询结果" in result["answer"]
    assert "巴西" in result["answer"]
    assert "小组头名" not in result["answer"]
    assert result["error"] is None
    assert result["tool_calls"][0]["tool"] == "query_schedule"
    assert result["tool_calls"][0]["input"] == {"team": "巴西"}
    assert result["tool_calls"][0]["status"] == "success"
    assert "巴西" in result["tool_calls"][0]["summary"]


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
            AIMessage(content="已查询阿根廷赛程和梅西数据，阿根廷肯定能夺冠。"),
        ]
    )

    result = chat_with_agent("查询阿根廷赛程和梅西数据", agent=fake_agent)

    assert "赛程查询结果" in result["answer"]
    assert "球员数据查询结果" in result["answer"]
    assert "肯定能夺冠" not in result["answer"]
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
    assert result["answer"] == "query_schedule 调用失败：没有找到球队：不存在队"


def test_empty_input_does_not_call_agent():
    fake_agent = FakeAgent()

    result = chat_with_agent("   ", agent=fake_agent)

    assert result["answer"] == "请输入你的问题。"
    assert result["tool_calls"] == []
    assert result["error"] == "user_input 不能为空"
    assert fake_agent.last_input is None


def test_agent_registers_three_world_cup_tools():
    tool_names = {tool.name for tool in WORLD_CUP_TOOLS}

    assert tool_names == {
        "query_schedule",
        "query_player_stats",
        "query_match_detail",
    }


def test_system_prompt_limits_answer_to_tool_results():
    assert "工具返回是唯一事实来源" in SYSTEM_PROMPT
    assert "不要补充背景知识" in SYSTEM_PROMPT
    assert "本地 SQLite 课程演示数据库" in SYSTEM_PROMPT


def test_real_tools_return_standard_contract():
    results = [
        query_schedule.invoke({"team": "阿根廷"}),
        query_player_stats.invoke({"player_name": "梅西"}),
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
