# Agent 前端对接说明

本文档面向前端和联调成员，描述当前真实可用的 Agent 接口。

## 0. 前端最小接入步骤

1. 启动后端：

```bash
uvicorn backend.app:app --reload --port 8000
```

2. 确认后端在线：

```bash
curl http://localhost:8000/api/health
```

期望返回：

```json
{"status":"ok"}
```

3. React 页面发送 `POST http://localhost:8000/api/chat`，不要直接调用 Python 文件。

4. 前端只需要先消费三个字段：

- `answer`：聊天气泡展示；
- `tool_calls`：Trace/工具调用过程展示；
- `error`：不为空时展示错误提示。

`result_payload` 当前固定为 `null`，前端结构化卡片可以先隐藏或降级展示 `answer`。

## 1. Python 内部入口

后端 API 内部调用 Agent 时导入：

```python
from agent import chat_with_agent
```

Python 内部调用方式：

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

React 前端不要直接导入 Python 函数，应通过第 5 节的 HTTP API 调用。

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

## 5. HTTP API 对接

React 前端通过 HTTP 调用：

```http
POST /api/chat
```

请求体：

```json
{
  "user_input": "请查询梅西的世界杯进球数据",
  "history": [
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "你好，我可以查询世界杯数据。"}
  ]
}
```

响应体：

```json
{
  "answer": "给用户看的最终回答",
  "tool_calls": [
    {
      "tool": "query_player_stats",
      "input": {"player_name": "梅西"},
      "status": "success",
      "summary": "{\"player_name\": \"梅西\", ...}"
    }
  ],
  "error": null,
  "result_payload": null
}
```

说明：

- Agent 内部使用 `success/error`；
- HTTP API 返回给前端时映射为 `success/failed`，对齐前端文档；
- `result_payload` 当前固定为 `null`，后续需要结构化卡片时再补。

React `fetch` 示例：

```js
async function sendMessage(userInput, history) {
  const response = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_input: userInput,
      history,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

前端历史维护示例：

```js
const result = await sendMessage(inputText, messages);

setMessages([
  ...messages,
  { role: "user", content: inputText },
  { role: "assistant", content: result.answer },
]);
```

注意：`history` 只传 `{ role, content }`，不要把 Trace 面板、卡片数据或前端组件状态传回后端。

## 6. 本地运行

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

运行 HTTP API：

```bash
uvicorn backend.app:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/api/health
```

联调请求示例：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"请查询梅西的世界杯进球数据","history":[]}'
```

## 7. 前端消费建议

- 对话区展示 `answer`；
- Trace 面板展示 `tool_calls`；
- 如果 `error != null`，展示错误提示；
- 当前没有 `result_payload` 时，结构化结果区可以先隐藏或降级展示 `answer`。
