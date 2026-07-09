# 前端对接说明

## 1. 文档目的

1. 本文档用于给队友说明：
   a. 前端发送给 Agent 统一入口的数据格式
   b. 前端期望收到的返回格式
   c. 前端如何消费这些字段做页面展示

2. 本文档以队长仓库中的 `docs/team-alignment.md` 为基线。

## 2. 前端发送格式

1. 请求方向
   前端 -> Agent 统一入口

2. 最小请求体

```json
{
  "user_input": "请查询梅西的世界杯进球数据",
  "history": [
    { "role": "user", "content": "C罗的数据" },
    { "role": "assistant", "content": "球员数据查询结果..." }
  ]
}
```

3. 字段说明
   a. `user_input`
   当前用户本次输入的问题

   b. `history`
   由前端维护的对话历史
   仅保留对话角色和内容，不传前端展示专用字段

4. `history` 单条结构

```json
{
  "role": "user | assistant",
  "content": "消息文本"
}
```

## 3. 前端期望返回格式

1. 最小响应体

```json
{
  "answer": "球员数据查询结果（当前数据库）：\n- 球员：利昂内尔・梅西\n- 球队：阿根廷\n- 进球：8",
  "tool_calls": [
    {
      "tool": "query_player_stats",
      "input": {
        "player_name": "梅西"
      },
      "status": "success",
      "summary": "{\"player_name\":\"利昂内尔・梅西\",\"team\":\"阿根廷\",\"goals\":8}"
    }
  ],
  "error": null,
  "result_payload": {
    "mode": "schedule",
    "title": "赛程查询结果",
    "summary": "共 1 场比赛，数据来自当前数据库。",
    "source_tools": ["query_schedule"],
    "data": [
      {
        "match_date": "2026-06-14",
        "match_time": "06:00",
        "stage": "小组赛C组",
        "home_team": "巴西",
        "away_team": "摩洛哥",
        "home_score": 1,
        "away_score": 1
      }
    ]
  }
}
```

2. 字段说明
   a. `answer`
   面向用户展示的最终回答

   b. `tool_calls`
   工具调用过程列表
   前端会用它来展示：
   - 工具名称
   - 输入参数
   - 成功/失败状态
   - 关键结果摘要

   c. `error`
   系统级错误信息
   若不为空，前端会展示错误提示

## 4. 结构化结果扩展字段

1. 为了支持卡片和表格展示，后端会在能构造结构化结果时返回 `result_payload`：

```json
{
  "result_payload": {
    "mode": "player_ranking",
    "title": "射手榜前十",
    "summary": "按进球数降序排列，数据来自当前数据库。",
    "source_tools": ["query_top10_scorers"],
    "data": [
      {
        "player_name": "利昂内尔・梅西",
        "team": "阿根廷",
        "goals": 8,
        "assists": 3,
        "appearances": 5
      }
    ]
  }
}
```

2. 说明
   a. `result_payload` 不是最小必需契约
   b. 它是前端展示层扩展字段
   c. 它生成失败或没有合适结构时仍会返回 `null`
   d. 如果 `result_payload === null`，前端仍然展示：
   - `answer`
   - `tool_calls`
   - `error`

3. 统一字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `mode` | string | 前端选择展示组件的模式 |
| `title` | string | 结果区标题 |
| `summary` | string | 结果区说明 |
| `source_tools` | string[] | 生成该结构化结果的工具名 |
| `data` | object 或 array | 结构化数据，字段保持后端 snake_case |

4. 当前后端支持的 `result_payload.mode`

| mode | 覆盖工具 | data 形状 |
|---|---|---|
| `schedule` | `query_schedule` | 比赛列表 |
| `player` | `query_player_stats`、`query_top_scorer_by_team` | 单个球员对象 |
| `player_ranking` | `query_players`、`query_top10_scorers` | 球员列表 |
| `player_comparison` | 多个 `query_player_stats` | 球员列表 |
| `goalkeeper` | `query_best_goalkeeper` | 单个门将对象 |
| `match_detail` | `query_match_detail` | 单场比赛详情对象 |

## 5. 前端页面与字段映射

1. 对话区
   a. 使用 `user_input` 和 `answer`
   b. `history` 由前端本地维护

2. Trace 面板
   a. 使用 `tool_calls`
   b. 每个工具调用展示：
   - `tool`
   - `input`
   - `status`
   - `summary`

3. 错误展示
   a. 使用 `error`
   b. 如果 `error != null`，页面展示错误提示

4. 结构化结果区
   a. 优先使用 `result_payload`
   b. 如果没有该字段，则只展示 `answer`

## 6. 前端当前约定的状态规则

1. `tool_calls[].status`
   建议值：
   a. `success`
   b. `failed`

2. `error`
   a. 正常情况：`null`
   b. 出错情况：返回可直接给用户看的错误说明

3. 前端不展示的内容
   a. 隐藏思维链
   b. 完整 Prompt
   c. 密钥
   d. 未处理内部日志

## 7. 当前真实接口示例

1. 赛程查询

```json
{
  "answer": "赛程查询结果（当前数据库）：\n- 2026-06-14 06:00，小组赛C组，巴西 1:1 摩洛哥",
  "tool_calls": [
    {
      "tool": "query_schedule",
      "input": { "team": "巴西" },
      "status": "success",
      "summary": "[{\"match_date\":\"2026-06-14\",\"match_time\":\"06:00\",\"stage\":\"小组赛C组\",\"home_team\":\"巴西\",\"away_team\":\"摩洛哥\",\"home_score\":1,\"away_score\":1}]"
    }
  ],
  "error": null,
  "result_payload": {
    "mode": "player",
    "title": "阿根廷队内最佳射手",
    "summary": "队内最佳射手数据来自当前数据库。",
    "source_tools": ["query_top_scorer_by_team"],
    "data": {
      "player_name": "利昂内尔・梅西",
      "team": "阿根廷",
      "goals": 8,
      "assists": 3,
      "appearances": 5
    }
  }
}
```

2. 队内最佳射手查询

```json
{
  "answer": "阿根廷队内最佳射手（当前数据库）：\n- 球员：利昂内尔・梅西（阿根廷）\n- 进球：8",
  "tool_calls": [
    {
      "tool": "query_top_scorer_by_team",
      "input": { "team": "阿根廷" },
      "status": "success",
      "summary": "{\"team\":\"阿根廷\",\"top_scorer\":{\"player_name\":\"利昂内尔・梅西\",\"team\":\"阿根廷\",\"goals\":8}}"
    }
  ],
  "error": null,
  "result_payload": {
    "mode": "match_detail",
    "title": "阿根廷 vs 佛得角 比赛详情",
    "summary": "比赛详情和进球记录来自当前数据库。",
    "source_tools": ["query_match_detail"],
    "data": {
      "match_id": 87,
      "match_date": "2026-07-04",
      "match_time": "06:00",
      "stage": "1/16决赛",
      "home_team": "阿根廷",
      "away_team": "佛得角",
      "home_score": 3,
      "away_score": 2,
      "goals": []
    }
  }
}
```

3. 比赛详情查询

```json
{
  "answer": "比赛详情查询结果（当前数据库）：\n- 比分：阿根廷 3:2 佛得角",
  "tool_calls": [
    {
      "tool": "query_match_detail",
      "input": { "home_team": "阿根廷", "away_team": "佛得角" },
      "status": "success",
      "summary": "{\"home_team\":\"阿根廷\",\"away_team\":\"佛得角\",\"home_score\":3,\"away_score\":2}"
    }
  ],
  "error": null,
  "result_payload": {
    "mode": "match_detail",
    "title": "阿根廷 vs 佛得角 比赛详情",
    "summary": "比赛详情和进球记录来自当前数据库。",
    "source_tools": ["query_match_detail"],
    "data": {
      "match_id": 87,
      "match_date": "2026-07-04",
      "match_time": "06:00",
      "stage": "1/16决赛",
      "home_team": "阿根廷",
      "away_team": "佛得角",
      "home_score": 3,
      "away_score": 2,
      "goals": []
    }
  }
}
```

## 8. 联调建议

1. 基础展示
   前端必须稳定展示：
   a. `answer`
   b. `tool_calls`
   c. `error`

2. 结构化展示
   前端可以按 `result_payload.mode` 逐步补卡片或表格。
   如果遇到未知 `mode` 或 `result_payload === null`，降级展示 `answer`。

3. 如果接口字段要改
   a. 先在 PR 或群里说明
   b. 明确改动前后结构
   c. 通知前端同步调整

## 9. 当前前端代码位置

1. 查询页主逻辑
   `frontend/src/pages/QueryPage.jsx`

2. 示例问题和预设展示配置
   `frontend/src/data/queryExamples.js`

3. 工具调用展示
   `frontend/src/components/TraceInspector.jsx`

4. 结构化结果展示
   `frontend/src/components/ResultShowcase.jsx`
