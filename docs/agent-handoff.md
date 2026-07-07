# Agent 前端对接说明

本文档面向前端和联调成员，描述当前真实可用的 Agent 接口。

## 1. 调用入口

前端直接导入：

```python
from agent import chat_with_agent
```

调用方式：

```python
result = chat_with_agent(
    user_input="请查询梅西的世界杯进球数据",
    history=[
        {"role": "user", "content": "你好"},
        {"role": "assistant", "content": "你好，我可以查询世界杯数据。"},
    ],
)
```

`history` 可以为空或不传：

```python
result = chat_with_agent("请查询巴西队赛程")
```

## 2. 返回结构

Agent 返回固定结构：

```python
{
    "answer": "给用户看的最终回答",
    "tool_calls": [
        {
            "tool": "query_player_stats",
            "input": {"player_name": "梅西"},
            "status": "success",
            "summary": "{\"player_name\": \"梅西\", ...}",
        }
    ],
    "error": None,
}
```

前端展示建议：

- `answer`：主聊天气泡；
- `tool_calls`：放在可展开区域，展示工具名、参数、状态、摘要；
- `error`：如果不为 `None`，展示为错误提示。

## 3. 当前已注册工具

Agent 当前注册三个工具：

| 工具名 | 用途 | 典型参数 |
|---|---|---|
| `query_schedule` | 查询赛程 | `{"team": "巴西"}`、`{"date": "2026-06-14"}`、`{"stage": "1/8决赛"}` |
| `query_player_stats` | 查询球员数据 | `{"player_name": "梅西"}` |
| `query_match_detail` | 查询比赛详情 | `{"home_team": "阿根廷", "away_team": "佛得角"}` 或 `{"match_id": 87}` |

工具统一返回：

```python
{"success": True, "data": ..., "error": None}
```

失败时：

```python
{"success": False, "data": None, "error": "错误说明"}
```

## 4. 重要边界

当前数据来自 `tools/worldcup.db`，定位为本地 SQLite 课程演示数据库，不声明为官方实时数据。

LLM 负责理解用户问题和选择工具；工具型问题的最终回答由 `agent.py` 根据工具返回字段格式化，避免模型补充工具外事实。

## 5. 本地运行

准备环境：

```bash
python3.12 -m venv .venv
source .venv/bin/activate.fish
python -m pip install -r requirements.txt
cp .env.example .env
```

在 `.env` 中填入：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

运行测试：

```bash
python -m pytest -q
```

运行命令行 Demo：

```bash
python agent.py
```

## 6. 最小前端伪代码

```python
import streamlit as st
from agent import chat_with_agent

if "messages" not in st.session_state:
    st.session_state.messages = []

user_input = st.chat_input("请输入世界杯相关问题")

if user_input:
    result = chat_with_agent(user_input, st.session_state.messages)

    st.session_state.messages.append({"role": "user", "content": user_input})
    st.session_state.messages.append({"role": "assistant", "content": result["answer"]})

    st.write(result["answer"])

    with st.expander("工具调用过程"):
        st.json(result["tool_calls"])

    if result["error"]:
        st.error(result["error"])
```
