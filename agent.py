import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.messages import AIMessage, ToolMessage
from langchain_deepseek import ChatDeepSeek

from tools import query_match_detail, query_player_stats, query_schedule


load_dotenv()


WORLD_CUP_TOOLS = [query_schedule, query_player_stats, query_match_detail]

SYSTEM_PROMPT = (
    "你是世界杯数据助手。"
    "所有赛程、球员统计、比赛详情问题必须调用对应工具。"
    "工具返回是唯一事实来源；最终回答只能复述或整理工具返回的字段。"
    "如果工具没有返回某个事实，就明确说明当前本地数据没有该字段。"
    "不要补充背景知识、历史纪录、预测、实时新闻或工具外事实。"
    "当前数据来自本地 SQLite 课程演示数据库，不代表官方实时数据。"
)

SUPPORTED_SCOPE_ANSWER = (
    "当前系统主要支持世界杯赛程查询、球员数据查询和比赛详情查询。"
    "你可以这样提问：请查询巴西队赛程；请查询梅西的世界杯进球数据；"
    "请查询阿根廷和佛得角的比赛详情。"
)


def build_agent():
    api_key = os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        raise RuntimeError("没有配置 DEEPSEEK_API_KEY")

    model = ChatDeepSeek(
        model="deepseek-v4-flash",
        api_key=api_key,
        base_url="https://api.deepseek.com",
        timeout=30,
        max_retries=2,
        extra_body={"thinking": {"type": "disabled"}},
    )

    return create_agent(
        model=model,
        tools=WORLD_CUP_TOOLS,
        system_prompt=SYSTEM_PROMPT,
    )


def _contains_meaningful_characters(text: str) -> bool:
    return any(char.isalnum() or "\u4e00" <= char <= "\u9fff" for char in text)


def _is_low_information_input(text: str) -> bool:
    compact_text = re.sub(r"\s+", "", text)

    if not _contains_meaningful_characters(compact_text):
        return True

    if re.fullmatch(r"[A-Za-z0-9_!?.,;:#@$%^&*()+=\\/-]{1,20}", compact_text):
        return compact_text.lower() not in {"hi", "hello", "help"}

    return False


def _is_obviously_unsupported_query(text: str) -> bool:
    world_cup_keywords = {
        "世界杯",
        "赛程",
        "比赛",
        "比分",
        "进球",
        "助攻",
        "出场",
        "球员",
        "球队",
        "小组赛",
        "决赛",
        "阿根廷",
        "巴西",
        "法国",
        "德国",
        "西班牙",
        "葡萄牙",
        "梅西",
        "姆巴佩",
        "C罗",
        "哈兰德",
    }
    unsupported_keywords = {
        "天气",
        "股票",
        "股价",
        "汇率",
        "翻译",
        "写代码",
        "代码",
        "论文",
        "电影",
        "菜谱",
        "旅游",
        "新闻",
    }

    return any(keyword in text for keyword in unsupported_keywords) and not any(
        keyword in text for keyword in world_cup_keywords
    )


def _special_input_response(user_input: str) -> dict[str, Any] | None:
    text = user_input.strip()

    if _is_low_information_input(text):
        return {
            "answer": "请输入明确的世界杯查询问题，例如：请查询巴西队赛程。",
            "tool_calls": [],
            "error": "invalid_input",
        }

    if _is_obviously_unsupported_query(text):
        return {
            "answer": SUPPORTED_SCOPE_ANSWER,
            "tool_calls": [],
            "error": "unsupported_query",
        }

    return None


def _tool_result_summary(content: Any) -> tuple[str, str]:
    status, summary, _ = _parse_tool_result(content)
    return status, summary


def _parse_tool_result(content: Any) -> tuple[str, str, Any]:
    try:
        parsed_content = json.loads(content) if isinstance(content, str) else content
    except json.JSONDecodeError:
        parsed_content = content

    if isinstance(parsed_content, dict):
        if parsed_content.get("success") is False:
            summary = str(parsed_content.get("error") or "工具调用失败")
            return "error", summary, None
        if "data" in parsed_content:
            summary = json.dumps(parsed_content["data"], ensure_ascii=False)
            return "success", summary, parsed_content["data"]

    return "success", str(content), parsed_content


def _format_schedule(data: Any) -> str:
    if not isinstance(data, list):
        return f"赛程查询结果：{json.dumps(data, ensure_ascii=False)}"

    lines = ["赛程查询结果（本地课程演示数据库）："]
    for match in data:
        if not isinstance(match, dict):
            lines.append(f"- {match}")
            continue

        score = f"{match.get('home_score')}:{match.get('away_score')}"
        lines.append(
            "- "
            f"{match.get('match_date')} {match.get('match_time')}，"
            f"{match.get('stage')}，"
            f"{match.get('home_team')} {score} {match.get('away_team')}"
        )

    return "\n".join(lines)


def _format_player_stats(data: Any) -> str:
    if not isinstance(data, dict):
        return f"球员数据查询结果：{json.dumps(data, ensure_ascii=False)}"

    fields = [
        ("球员", data.get("player_name")),
        ("球队", data.get("team")),
        ("进球", data.get("goals")),
        ("助攻", data.get("assists")),
        ("出场次数", data.get("appearances")),
    ]
    lines = ["球员数据查询结果（本地课程演示数据库）："]
    lines.extend(f"- {name}：{value}" for name, value in fields if value is not None)
    return "\n".join(lines)


def _format_match_detail(data: Any) -> str:
    if not isinstance(data, dict):
        return f"比赛详情查询结果：{json.dumps(data, ensure_ascii=False)}"

    score = f"{data.get('home_score')}:{data.get('away_score')}"
    lines = [
        "比赛详情查询结果（本地课程演示数据库）：",
        f"- 比赛ID：{data.get('match_id')}",
        f"- 时间：{data.get('match_date')} {data.get('match_time')}",
        f"- 阶段：{data.get('stage')}",
        f"- 比分：{data.get('home_team')} {score} {data.get('away_team')}",
    ]

    goals = data.get("goals")
    if isinstance(goals, list) and goals:
        lines.append("- 进球记录：")
        for goal in goals:
            if not isinstance(goal, dict):
                lines.append(f"  - {goal}")
                continue

            event_type = goal.get("event_type")
            event_label = "乌龙球" if event_type == "own_goal" else "进球"
            lines.append(
                "  - "
                f"{goal.get('goal_time')}' "
                f"{goal.get('player_name')}（{goal.get('team')}，{event_label}）"
            )

    return "\n".join(lines)


def _format_tool_error(call: dict[str, Any]) -> str:
    summary = str(call.get("summary") or "查询暂时失败，请稍后重试。")

    if call["tool"] == "query_schedule":
        return f"赛程查询失败：{summary}"
    if call["tool"] == "query_player_stats":
        return f"球员数据查询失败：{summary}"
    if call["tool"] == "query_match_detail":
        return f"比赛详情查询失败：{summary}"

    return summary


def _format_tool_answer(tool_calls: list[dict[str, Any]]) -> str:
    sections = []

    for call in tool_calls:
        if call["status"] == "error":
            sections.append(_format_tool_error(call))
            continue

        data = call.get("_data")
        if call["tool"] == "query_schedule":
            sections.append(_format_schedule(data))
        elif call["tool"] == "query_player_stats":
            sections.append(_format_player_stats(data))
        elif call["tool"] == "query_match_detail":
            sections.append(_format_match_detail(data))
        else:
            sections.append(f"{call['tool']} 查询结果：{call['summary']}")

    return "\n\n".join(sections)


def chat_with_agent(
    user_input: str,
    history: list[dict[str, str]] | None = None,
    *,
    agent: Any = None,
) -> dict[str, Any]:
    """调用 Agent，并返回供前端使用的稳定结果结构。"""
    if not user_input.strip():
        return {
            "answer": "请输入你的问题。",
            "tool_calls": [],
            "error": "user_input 不能为空",
        }

    special_response = _special_input_response(user_input)
    if special_response is not None:
        return special_response

    messages = [*(history or []), {"role": "user", "content": user_input.strip()}]

    try:
        active_agent = agent or build_agent()
        result = active_agent.invoke({"messages": messages})
    except Exception as error:
        return {
            "answer": "当前无法完成请求，请稍后重试。",
            "tool_calls": [],
            "error": str(error),
        }

    answer = ""
    tool_calls = []
    tool_calls_by_id = {}

    for message in result["messages"]:
        if isinstance(message, AIMessage):
            if message.content:
                answer = str(message.content)

            for call in message.tool_calls:
                record = {
                    "tool": call["name"],
                    "input": call["args"],
                    "status": "error",
                    "summary": "没有收到工具返回结果",
                }
                tool_calls.append(record)
                tool_calls_by_id[call["id"]] = record

        if isinstance(message, ToolMessage):
            record = tool_calls_by_id.get(message.tool_call_id)
            if record is not None:
                status, summary, data = _parse_tool_result(message.content)
                record["status"] = status
                record["summary"] = summary
                record["_data"] = data

    if tool_calls:
        answer = _format_tool_answer(tool_calls)

    for call in tool_calls:
        call.pop("_data", None)

    return {
        "answer": answer,
        "tool_calls": tool_calls,
        "error": None,
    }


def main():
    user_input = input("你：")
    result = chat_with_agent(user_input)

    print(f"\n助手：{result['answer']}")

    for call in result["tool_calls"]:
        print(f"工具：{call['tool']} ({call['status']})")
        print(f"参数：{call['input']}")
        print(f"结果：{call['summary']}")

    if result["error"]:
        print(f"错误：{result['error']}")


if __name__ == "__main__":
    main()
