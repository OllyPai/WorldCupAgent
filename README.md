# WorldCupAgent

世界杯工具调用智能体课程项目。

当前版本实现了一个基于 LangChain + DeepSeek 的 Agent 核心，可以根据用户自然语言问题调用本地工具查询赛程、球员数据和比赛详情。

## 当前能力

- 自然语言输入；
- 自动选择工具；
- 三个工具：赛程查询、球员数据查询、比赛详情查询；
- 统一返回 `answer / tool_calls / error`；
- 工具型回答只基于工具返回字段生成；
- 离线自动测试与真实 API 冒烟测试分离。

当前数据来自 `tools/worldcup.db`，属于课程演示数据库，不代表官方实时数据。

## 环境准备

推荐 Python 3.12。

```bash
python3.12 -m venv .venv
```

fish shell：

```bash
source .venv/bin/activate.fish
```

bash/zsh：

```bash
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

## 运行

命令行 Demo：

```bash
python agent.py
```

工具自测：

```bash
python test_tools.py
```

自动测试：

```bash
python -m pytest -q
```

## Agent 接口

```python
from agent import chat_with_agent

result = chat_with_agent(
    user_input="请查询梅西的世界杯进球数据",
    history=[],
)
```

返回：

```python
{
    "answer": "给用户看的回答",
    "tool_calls": [
        {
            "tool": "query_player_stats",
            "input": {"player_name": "梅西"},
            "status": "success",
            "summary": "..."
        }
    ],
    "error": None,
}
```

更多前端对接说明见 `docs/agent-handoff.md`。

## 项目结构

```text
agent.py                  # Agent 核心与统一入口
tools/                    # 三个工具与 SQLite 数据库
tests/test_minimal_agent.py
docs/team-alignment.md    # 小组接口与协作基线
docs/agent-handoff.md     # 前端对接说明
task_plan.md              # 项目计划
progress.md               # 进度日志
findings.md               # 发现与决策
```
