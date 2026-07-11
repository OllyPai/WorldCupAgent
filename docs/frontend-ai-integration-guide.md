# 前端接入指南（给前端同学和 AI 助手）

本文档用于指导前端把当前 Mock 数据切换到真实后端 API。

当前后端接口已经合并到 `main`，前端不需要切换到个人分支。

## 1. 当前结论

- 后端基础地址：`http://localhost:8000`
- 健康检查：`GET /api/health`
- 聊天接口：`POST /api/chat`
- 前端必须稳定消费：`answer`、`tool_calls`、`error`
- `result_payload` 是可选结构化展示字段；存在时按 `mode` 展示，不存在或未知 `mode` 时降级展示 `answer`
- 数据来自本地 SQLite 课程演示数据库，不是官方实时数据

## 2. 后端启动方式

在项目根目录运行：

```bash
git pull
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

在 `.env` 中填入：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

启动后端：

```bash
uvicorn backend.app:app --reload --port 8000
```

如果使用 fish shell，激活虚拟环境用：

```bash
source .venv/bin/activate.fish
```

## 3. 后端是否启动成功

浏览器或 curl 访问：

```bash
curl http://localhost:8000/api/health
```

期望返回：

```json
{"status":"ok"}
```

也可以打开 FastAPI 自动文档：

```text
http://localhost:8000/docs
```

## 4. 接口契约

### 请求

```http
POST http://localhost:8000/api/chat
Content-Type: application/json
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

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_input` | string | 用户本轮输入 |
| `history` | array | 前端维护的历史，只传 `{role, content}` |
| `history[].role` | `"user"` 或 `"assistant"` | 消息角色 |
| `history[].content` | string | 消息文本 |

### 响应

```json
{
  "answer": "球员数据查询结果（本地课程演示数据库）：\n- 球员：梅西\n- 进球：13",
  "tool_calls": [
    {
      "tool": "query_player_stats",
      "input": {"player_name": "梅西"},
      "status": "success",
      "summary": "{\"player_name\":\"梅西\",\"goals\":13}"
    }
  ],
  "error": null,
  "result_payload": {
    "mode": "player",
    "title": "梅西数据统计",
    "summary": "球员数据来自当前数据库。",
    "source_tools": ["query_player_stats"],
    "data": {
      "player_name": "梅西",
      "team": "阿根廷",
      "goals": 13
    }
  }
}
```

字段说明：

| 字段 | 类型 | 前端用途 |
|---|---|---|
| `answer` | string | 聊天气泡主内容 |
| `tool_calls` | array | Trace 面板 / 工具调用过程 |
| `tool_calls[].tool` | string | 工具名 |
| `tool_calls[].input` | object | 工具参数 |
| `tool_calls[].status` | `"success"` 或 `"failed"` | 工具调用状态 |
| `tool_calls[].summary` | string | 工具结果摘要，前端按文本展示即可 |
| `error` | string 或 null | 不为空时展示错误提示 |
| `result_payload` | object 或 null | 结构化展示数据；没有合适结构时为 null |

`result_payload` 是已有接口字段的向后兼容补全。前端不能假设它一定存在，也不能因为它为 `null` 或未知 `mode` 而阻塞 `answer` 展示。

当前支持的 `mode`：

| mode | 前端建议展示 |
|---|---|
| `schedule` | 赛程列表 |
| `player` | 单球员卡片 |
| `player_ranking` | 球员排行表 |
| `player_comparison` | 多球员对比表 |
| `goalkeeper` | 门将数据卡片 |
| `match_detail` | 比赛详情卡 |

## 5. 前端最小实现方案

目标：先把页面从 Mock 数据切到真实 API，不做额外功能。

建议步骤：

1. 新建或修改一个 API 调用函数，例如 `sendChatMessage`。
2. 在查询页提交用户输入时调用 `POST /api/chat`。
3. 把用户输入追加到本地 `messages`。
4. 把后端返回的 `answer` 追加为 assistant 消息。
5. 把后端返回的 `tool_calls` 交给 Trace 面板。
6. 如果 `error !== null`，展示错误提示。
7. 如果 `result_payload` 有前端已支持的 `mode`，展示结构化卡片或表格；否则降级展示 `answer`。

## 6. 推荐 fetch 封装

```js
const API_BASE_URL = "http://localhost:8000";

export async function sendChatMessage(userInput, history) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_input: userInput,
      history: history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`后端请求失败：HTTP ${response.status}`);
  }

  return response.json();
}
```

如果项目使用 Vite，可以改成：

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
```

对应 `.env.local`：

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 7. 页面调用示例

```js
async function handleSend(inputText) {
  const userMessage = {
    role: "user",
    content: inputText,
  };

  const historyForBackend = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  setMessages((prev) => [...prev, userMessage]);
  setLoading(true);
  setError(null);

  try {
    const result = await sendChatMessage(inputText, historyForBackend);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: result.answer,
      },
    ]);

    setToolCalls(result.tool_calls || []);

    if (result.error) {
      setError(result.error);
    }
  } catch (err) {
    setError(err.message || "请求后端失败");
  } finally {
    setLoading(false);
  }
}
```

注意：这里的 `messages` 应该只包含 `{role, content}`。不要把前端组件状态、Trace 数据、卡片数据传回后端。

## 8. 可直接测试的 curl

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"请查询梅西的世界杯进球数据","history":[]}'
```

赛程查询：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"请查询巴西队赛程","history":[]}'
```

比赛详情：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"请查询阿根廷和佛得角的比赛详情","history":[]}'
```

错误展示：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"","history":[]}'
```

空输入会返回 HTTP 200，但 `error` 不为 `null`。前端应展示 `error`，不要把它当成网络失败。

## 9. 给前端 AI 助手的约束

如果你是前端同学使用的 AI 助手，请遵守以下约束：

1. 不要修改后端接口契约。
2. 不要让前端直接 import Python 文件。
3. 不要把 `result_payload` 当成必有字段；它仍然可能是 `null`。
4. 不要把 `tool_calls[].summary` 当成结构化数据源；结构化展示优先使用 `result_payload`。
5. 不要把思维链、Prompt、密钥、内部日志展示给用户。
6. 不要新增后端字段来“猜测”功能，除非先和后端对齐。
7. 前端历史只传 `{role, content}`。
8. 如果跨域报错，先确认后端是否在 `localhost:8000` 正常运行，再检查请求地址。
9. 如果模型返回慢，前端显示 loading，不要重复发送多次请求。
10. 本阶段目标是替换 Mock 并完成联调，不要顺手重构整个前端。

## 10. 常见问题

### 10.1 请求失败，浏览器显示 Failed to fetch

先检查：

```bash
curl http://localhost:8000/api/health
```

如果健康检查失败，说明后端没启动或端口不对。

### 10.2 后端返回 `error`，但 HTTP 状态是 200

这是预期行为。业务错误通过响应体的 `error` 表达，方便前端统一展示。

例如：

```json
{
  "answer": "请输入你的问题。",
  "tool_calls": [],
  "error": "user_input 不能为空",
  "result_payload": null
}
```

### 10.3 `tool_calls` 为空

可能是用户问候、闲聊或能力说明，不需要工具。前端正常展示 `answer` 即可。

### 10.4 `tool_calls[].status` 是 `failed`

说明工具被调用了，但查询失败或没有查到数据。前端展示工具失败状态和 `summary` 即可。

### 10.5 前端想做表格或卡片

优先读取 `result_payload`：

- `result_payload.mode` 决定展示组件；
- `result_payload.data` 是结构化数据；
- `result_payload.source_tools` 表明数据来自哪些工具。

如果 `result_payload === null` 或前端暂未支持某个 `mode`，降级展示 `answer`。

## 11. 联调验收清单

前端接入完成后，至少验证这些场景：

- [ ] 打开页面后，能正常输入问题并发送。
- [ ] 查询“请查询梅西的世界杯进球数据”，页面展示 `answer`。
- [ ] 如果返回 `result_payload.mode === "player"`，页面能展示或降级展示球员数据。
- [ ] Trace 面板能展示 `query_player_stats`。
- [ ] 查询“请查询巴西队赛程”，页面展示赛程回答。
- [ ] 查询“谁是进球最多的球员”，页面能处理 `player_ranking`。
- [ ] 查询“谁是扑救最多的门将”，页面能处理 `goalkeeper`。
- [ ] 查询“请查询阿根廷和佛得角的比赛详情”，页面展示比赛详情回答。
- [ ] 空输入能展示错误提示，不崩溃。
- [ ] 后端没启动时，前端能展示网络错误。
- [ ] 多轮对话时，前端传回的 `history` 只包含 `{role, content}`。

## 12. 最小交付标准

本阶段不要求前端完成所有 UI 细节。最低标准是：

1. 前端不再依赖 Mock 数据完成主要问答。
2. 能调用真实 `/api/chat`。
3. 能展示 `answer`。
4. 能展示 `tool_calls`。
5. 能展示 `error`。
6. 能在 `result_payload` 存在时展示结构化结果，或对暂不支持的 `mode` 降级展示 `answer`。
7. 浏览器端完成至少三类问题的演示：球员数据、赛程、比赛详情。
