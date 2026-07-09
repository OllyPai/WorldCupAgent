# WorldCupAgent

世界杯工具调用智能体课程项目。

当前系统实现了一个基于 LangChain + DeepSeek 的 Agent：用户用自然语言提问，Agent 判断是否需要调用工具，再从本地 SQLite 课程演示数据库中查询赛程、球员数据、球员排行、队内最佳射手、门将扑救或比赛详情，并返回给前端展示。

当前数据来自 `tools/worldcup.db`，定位为课程演示数据，不代表官方实时数据。

## 当前能力

- 自然语言问答入口；
- 自动选择工具；
- 七个已注册工具：
  - `query_schedule`：赛程查询；
  - `query_player_stats`：单个球员数据查询；
  - `query_players`：球员列表与排行查询；
  - `query_match_detail`：比赛详情查询；
  - `query_top_scorer_by_team`：队内最佳射手查询；
  - `query_best_goalkeeper`：门将扑救排行查询；
  - `query_top10_scorers`：射手榜前十查询；
- FastAPI HTTP 接口：`GET /api/health`、`POST /api/chat`；
- 统一返回 `answer / tool_calls / error / result_payload`；
- 工具型回答只基于工具返回字段生成，避免模型补充工具外事实；
- 对空输入、纯符号输入、明显超出世界杯范围的问题有前置兜底；
- 后端离线测试与真实模型冒烟测试分离。

## 快速启动后端

推荐 Python 3.12。

```bash
python3.12 -m venv .venv
```

激活虚拟环境：

```bash
# fish
source .venv/bin/activate.fish

# bash / zsh
source .venv/bin/activate
```

安装依赖：

```bash
python -m pip install -r requirements.txt
```

配置环境变量：

```bash
cp .env.example .env
```

然后在 `.env` 中填入：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

启动后端：

```bash
uvicorn backend.app:app --reload --port 8000
```

验证后端在线：

```bash
curl http://localhost:8000/api/health
```

期望返回：

```json
{"status":"ok"}
```

FastAPI 自动接口文档：

```text
http://localhost:8000/docs
```

## 启动前端

前端代码位于 `frontend/`。

```bash
cd frontend
npm install
npm run dev
```

Vite 默认会输出本地访问地址，通常是：

```text
http://localhost:5173
```

如果前端需要显式配置后端地址，可在 `frontend/.env.local` 中写入：

```env
VITE_API_BASE_URL=http://localhost:8000
```

## API 调用示例

聊天接口：

```http
POST http://localhost:8000/api/chat
Content-Type: application/json
```

请求体：

```json
{
  "user_input": "请查询梅西的世界杯进球数据",
  "history": []
}
```

返回体：

```json
{
  "answer": "给用户看的回答",
  "tool_calls": [
    {
      "tool": "query_player_stats",
      "input": {"player_name": "梅西"},
      "status": "success",
      "summary": "工具结果摘要"
    }
  ],
  "error": null,
  "result_payload": {
    "mode": "player",
    "title": "梅西数据统计",
    "summary": "球员数据来自当前数据库。",
    "source_tools": ["query_player_stats"],
    "data": {"player_name": "梅西", "team": "阿根廷", "goals": 8}
  }
}
```

可直接测试的 curl：

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

比赛详情查询：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"请查询阿根廷和佛得角的比赛详情","history":[]}'
```

队内最佳射手查询：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"阿根廷进球最多的球员是谁","history":[]}'
```

射手榜查询：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"谁是进球最多的球员","history":[]}'
```

门将扑救查询：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"谁是扑救最多的门将","history":[]}'
```

特殊输入兜底：

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_input":"???###","history":[]}'
```

## 运行测试

工具层自测：

```bash
python test_tools.py
```

后端自动测试：

```bash
python -m pytest -q
```

前端构建检查：

```bash
cd frontend
npm run build
```

## 当前前后端契约

前端只需要先消费这些字段：

| 字段 | 用途 |
|---|---|
| `answer` | 聊天气泡主内容 |
| `tool_calls` | Trace 面板 / 工具调用过程 |
| `error` | 不为空时展示错误提示 |
| `result_payload` | 可选结构化展示数据；没有合适结构时为 `null` |

详细前端接入说明见：

- `docs/agent-handoff.md`
- `docs/frontend-ai-integration-guide.md`

## 常见问题

### fish 激活虚拟环境报错

如果使用 fish shell，不要执行：

```bash
source .venv/bin/activate
```

应执行：

```bash
source .venv/bin/activate.fish
```

### `DEEPSEEK_API_KEY` 未配置

真实模型调用需要 `.env` 中存在：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

如果只跑离线自动测试，通常不会请求真实模型。

### 前端请求失败

先确认后端是否启动：

```bash
curl http://localhost:8000/api/health
```

如果健康检查失败，先启动：

```bash
uvicorn backend.app:app --reload --port 8000
```

### `tool_calls` 为空

这是允许的。用户问候、能力说明、空输入或明显无效输入可能不需要调用工具，前端正常展示 `answer` 和 `error` 即可。

### `result_payload` 是 `null`

这是允许的。`answer` 和 `tool_calls` 是核心结果；`result_payload` 是增强展示字段。前端遇到 `null` 或暂不支持的 `mode` 时，降级展示 `answer` 即可。

当前支持的 `result_payload.mode`：

| mode | 用途 |
|---|---|
| `schedule` | 赛程列表 |
| `player` | 单球员卡片 |
| `player_ranking` | 球员排行 |
| `player_comparison` | 多球员对比 |
| `goalkeeper` | 门将数据 |
| `match_detail` | 比赛详情 |

### 如何查询“某国进球最多的球员”

当前已支持队内最佳射手查询。可以这样问：

```text
阿根廷进球最多的球员是谁？
法国队内最佳射手是谁？
```

如果返回未查询到，通常表示当前本地课程演示数据库中没有该球队的球员数据，或球队名称没有匹配到。

## 项目结构

```text
agent.py                          # Agent 核心与统一入口
backend/app.py                    # FastAPI HTTP 适配层
tools/                            # 七个查询工具与 SQLite 数据库
tests/test_minimal_agent.py       # Agent 离线测试
test_tools.py                     # 工具层自测
frontend/                         # React + Vite 前端
docs/agent-handoff.md             # 后端给前端的接口交接
docs/frontend-ai-integration-guide.md
docs/known-issues.md              # 当前已知问题清单
task_plan.md                      # 项目计划
progress.md                       # 进度日志
findings.md                       # 发现与决策
```
