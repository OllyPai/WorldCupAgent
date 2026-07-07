# WorldCupAgent 进度日志

## 当前状态（2026-07-07）

- **当前阶段：** 阶段 5——Web 联调
- **分支：** `main`
- **工作区：** API 适配层已合并到主分支；仍存在未跟踪的 `docs/proposal-report.md`、`output/`、`tmp/`
- **外部依赖变化：** 队友工具 PR #2、Agent 核心 PR #3 和 API 适配 PR #4 均已合并到 GitHub `main`。

## 已完成记录

### 阶段 1：范围、分工与接口对齐

- **状态：** complete
- 对齐课程题目、评分要求、三人分工和必做功能。
- 建立 `docs/team-alignment.md`。
- 通过 PR 合并协作说明到 `main`。
- 用户从 `main` 创建个人分支 `zheng/agent-core`。

### 阶段 2A：环境与最小 Agent

- **状态：** complete
- 安装并验证 Python 3.12.13。
- 创建并激活 `.venv`，fish 使用 `activate.fish`。
- 安装 pytest、LangChain、DeepSeek 集成和 dotenv。
- 实现赛程与球员数据两个 Mock 工具。
- 配置 DeepSeek 模型和 LangChain Agent。
- 真实运行赛程查询和梅西数据查询成功。

### 阶段 2B：统一入口与基础测试

- **状态：** complete
- 新增 `chat_with_agent(user_input, history)`。
- 统一输出 `answer / tool_calls / error`。
- 将工具成功与结构化失败转换为前端可展示记录。
- 将模型/API 异常转换为稳定返回值。
- 命令行入口改为复用统一入口。
- 使用 `FakeAgent` 避免自动测试调用真实 API。

### 阶段 3/4：三工具接入与核心测试

- **状态：** in_progress
- 拉取并在当前分支 no-commit 合入 PR #2（`feat/tools-data`）进行集成验证。
- 队友工具自测 `test_tools.py` 通过。
- `agent.py` 已从 `tools` 包导入并注册 `query_schedule`、`query_player_stats`、`query_match_detail` 三个工具。
- 系统提示已明确：工具返回是唯一事实来源，当前数据来自本地 SQLite 课程演示数据库。
- Agent 离线测试从 5 条扩展到 10 条。
- 已形成本地里程碑提交，提交信息为 `Integrate world cup tools with agent core`。

### 阶段 3C：真实模型冒烟与回答收敛

- **状态：** complete
- 真实模型能够正确选择赛程、球员数据、比赛详情三个工具。
- 发现仅靠 Prompt 仍不足以阻止模型做额外推断，例如“小组头名出线”“晋级下一轮”。
- 已改为：LLM 负责理解问题和选择工具；`chat_with_agent()` 基于工具返回数据生成最终回答。
- 直接问候类请求不调用工具，仍返回模型自然语言回答。
- 不存在球员查询能返回结构化工具错误，不抛异常。

### GitHub 协作状态

- PR #2 `tools` 已合并到 `main`。
- PR #3 Agent 核心已合并到 `main`。
- PR #4 API 适配已合并到 `main`。
- 当前分支为 `main`，前端可以直接基于主分支接入 `/api/chat`。

### 阶段 5/6：前端交接与启动文档

- **状态：** in_progress
- 已重写 `docs/agent-handoff.md`，移除旧版错误信息，改为当前 `chat_with_agent()` 接口说明。
- 已新增 `README.md`，包含环境准备、运行、测试和接口示例。
- 已新增 `.env.example`，说明 `DEEPSEEK_API_KEY`。
- 已新增 `requirements.txt`，列出当前核心依赖和 FastAPI HTTP 适配层依赖。

### 阶段 5B：FastAPI 适配层

- **状态：** in_progress
- 读取前端契约 `/Users/oripi/Library/Containers/com.tencent.qq/Data/Downloads/frontend-api-contract.md`。
- 确认前端是 React/JS 方向，不能直接 import Python 函数。
- 删除未提交的 Streamlit 最小页尝试，改为 FastAPI HTTP 适配层。
- 新增 `backend/app.py`，提供 `GET /api/health` 和 `POST /api/chat`。
- `POST /api/chat` 接收 `user_input/history`，内部调用 `chat_with_agent()`。
- API 响应包含 `answer/tool_calls/error/result_payload`，其中 `result_payload` 当前为 `null`。
- API 层将 Agent 内部工具状态 `error` 映射成前端契约中的 `failed`。
- 已补充 `docs/agent-handoff.md` 前端最小接入步骤、React `fetch` 示例和历史维护示例。
- 已调整 API 空输入处理：空字符串不再被 FastAPI 返回默认 422，而是走 `chat_with_agent()` 并返回统一前端契约。
- 已新增 `docs/frontend-ai-integration-guide.md`，面向前端同学和前端 AI 助手，说明真实 API 接入步骤、fetch 示例、AI 约束和联调验收清单。
- 已新增 `docs/known-issues.md`，汇总当前 UI 文案、Trace 状态、Mock/示例数据边界、README 启动说明、正式文档和本地工作区问题。

## 测试结果

| 日期 | 测试 | 结果 | 状态 |
|------|------|------|------|
| 2026-07-06 | `.venv/bin/python -m pytest -q` | 5 passed in 0.34s | 通过 |
| 2026-07-06 | `.venv/bin/python -m py_compile agent.py` | 无输出 | 通过 |
| 2026-07-06 | `git diff --check` | 无错误 | 通过 |
| 2026-07-06 | 真实赛程单工具调用 | 正确选择 `query_schedule` 并返回 Mock 数据 | 通过 |
| 2026-07-06 | 真实球员单工具调用 | 正确选择 `query_player_stats`，但最终回答补充了工具外事实 | 部分通过 |
| 2026-07-07 | `.venv/bin/python test_tools.py` | 三个队友工具均返回 `success / data / error` 结构 | 通过 |
| 2026-07-07 | `.venv/bin/python -m py_compile agent.py tools/*.py test_tools.py` | 无输出 | 通过 |
| 2026-07-07 | `.venv/bin/python -m pytest -q` | 10 passed in 0.49s | 通过 |
| 2026-07-07 | `git diff --check` | 无输出 | 通过 |
| 2026-07-07 | 真实球员数据冒烟 | 正确调用 `query_player_stats`，最终回答只展示球员、球队、进球、助攻、出场次数 | 通过 |
| 2026-07-07 | 真实赛程冒烟 | 正确调用 `query_schedule`；初次出现“小组头名”推断，改为代码格式化后只展示赛程字段 | 通过 |
| 2026-07-07 | 真实比赛详情冒烟 | 正确调用 `query_match_detail`；初次出现“晋级下一轮”推断，改为代码格式化后只展示比赛字段 | 通过 |
| 2026-07-07 | 真实直接问候冒烟 | 未调用工具，返回能力说明 | 通过 |
| 2026-07-07 | 真实工具错误冒烟 | 不存在球员返回 `tool_calls[0].status == error` 和可展示错误信息 | 通过 |
| 2026-07-07 | `.venv/bin/python -m pytest -q` | 13 passed, 1 FastAPI TestClient 上游弃用警告 | 通过 |
| 2026-07-07 | `.venv/bin/python -m py_compile agent.py backend/app.py tools/*.py test_tools.py` | 无输出 | 通过 |
| 2026-07-07 | `curl http://127.0.0.1:8000/api/health` | `{"status":"ok"}` | 通过 |
| 2026-07-07 | `POST /api/chat` 真实冒烟 | HTTP 层、Agent 层、工具层完整打通，返回前端契约 | 通过 |
| 2026-07-07 | `.venv/bin/python -m pytest -q` | 14 passed, 1 FastAPI TestClient 上游弃用警告 | 通过 |
| 2026-07-07 | `.venv/bin/python -m py_compile agent.py backend/app.py tools/*.py test_tools.py` | 无输出 | 通过 |
| 2026-07-07 | `git diff --check` | 无输出 | 通过 |
| 2026-07-07 | 合并 PR #4 后 `.venv/bin/python -m pytest -q` | 14 passed, 1 FastAPI TestClient 上游弃用警告 | 通过 |
| 2026-07-07 | 合并 PR #4 后 `.venv/bin/python -m py_compile agent.py backend/app.py tools/*.py test_tools.py` | 无输出 | 通过 |
| 2026-07-07 | 合并 PR #4 后 `git diff --check` | 无输出 | 通过 |

## 错误日志

| 日期 | 错误 | 尝试次数 | 解决方案/状态 |
|------|------|---------|---------------|
| 2026-07-06 | fish 加载 POSIX `activate` 报 `case` 语法错误 | 1 | 使用 `.venv/bin/activate.fish` |
| 2026-07-06 | 非激活 shell 中 `python` 命令不存在 | 1 | 使用 `.venv/bin/python` |
| 2026-07-06 | 测试收集时无法导入尚未实现的 `chat_with_agent` | 1 | 完成入口实现后 5 条测试通过 |
| 2026-07-06 | 模型回答包含工具外事实 | 2 | Prompt 约束不足，改为工具型问题由代码格式化最终回答 |
| 2026-07-07 | `git merge --no-commit --no-ff origin/feat/tools-data` 被沙盒禁止写 `.git/ORIG_HEAD.lock` | 1 | 授权后重试同一命令成功 |
| 2026-07-07 | `.venv/bin/streamlit` 不存在 | 1 | 结合前端契约判断不应继续 Streamlit，改做 FastAPI |

## 下一工作块

1. 把 `docs/frontend-ai-integration-guide.md` 发给前端队友接入；
2. 按 `docs/known-issues.md` 修复前端展示和文案问题；
3. 与前端完成浏览器端真实联调；
4. 汇总系统测试用例和缺陷记录；
5. 用户复述 `React → FastAPI → chat_with_agent → Agent → Tool → response` 数据流。

## 学习证据

- 已能正确创建和激活 Python 虚拟环境。
- 已实际运行一个会调用工具的 Agent。
- 统一入口和测试由 AI 提供主要实现，当前应记为“已接触、可在指导下理解”，尚未独立掌握。
- 已看到多人协作下“工具层 PR → Agent 集成验证 → 测试保护接口”的基本流程。
- 当前必须理解的新点：LLM 不适合负责严格事实边界；工具型回答用代码格式化更稳定。
- 当前必须理解的新点：React 前端和 Python Agent 之间需要 HTTP API 边界。
- 下一检查点：用户能够不用解释语法，复述 `main → chat_with_agent → Agent → Tool → 统一结果` 的数据流。

## 五问重启检查

| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 5：Web 联调 |
| 我要去哪里？ | 工具集成、Web 联调、系统测试、文档和最终交付 |
| 目标是什么？ | 完成可演示、可测试、可协作交付且用户能解释核心流程的课程项目 |
| 我学到了什么？ | 见 `findings.md` |
| 我做了什么？ | 见本文件“已完成记录” |

---

每个阶段完成后、发生错误时或上下文切换前更新本文件。
