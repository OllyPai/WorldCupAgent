import json
import os
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


def _tool_result_summary(content: Any) -> tuple[str, str]:
    try:
        parsed_content = json.loads(content) if isinstance(content, str) else content
    except json.JSONDecodeError:
        parsed_content = content

    if isinstance(parsed_content, dict):
        if parsed_content.get("success") is False:
            return "error", str(parsed_content.get("error") or "工具调用失败")
        if "data" in parsed_content:
            summary = json.dumps(parsed_content["data"], ensure_ascii=False)
            return "success", summary

    return "success", str(content)


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
                record["status"], record["summary"] = _tool_result_summary(
                    message.content
                )

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
