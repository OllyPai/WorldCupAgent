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
  "user_input": "阿根廷现在比分是多少？",
  "history": [
    { "role": "user", "content": "今天有哪些比赛？" },
    { "role": "assistant", "content": "今天共有 3 场世界杯比赛..." }
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
  "answer": "阿根廷当前 2 比 1 领先法国。",
  "tool_calls": [
    {
      "tool": "live_score_lookup",
      "input": {
        "team": "阿根廷",
        "scope": "today"
      },
      "status": "success",
      "summary": "匹配到阿根廷对法国，当前比分为 2 : 1。"
    }
  ],
  "error": null
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

## 4. 前端当前使用的扩展字段

1. 为了支持 richer UI，前端当前额外支持一个可选字段：

```json
{
  "result_payload": {}
}
```

2. 说明
   a. `result_payload` 不是最小必需契约  
   b. 它是前端展示层扩展字段  
   c. 如果后端暂时不提供，前端仍然可以先展示：
   - `answer`
   - `tool_calls`
   - `error`

3. 当前支持的 `result_payload.mode`
   a. `schedule`
   赛程表格

   b. `scorecard`
   单场比分卡

   c. `events`
   进球事件流

   d. `recommendation`
   焦点战推荐卡片

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

## 7. 当前 mock 示例

1. 赛程查询

```json
{
  "answer": "今天共有 3 场世界杯比赛...",
  "tool_calls": [
    {
      "tool": "match_schedule_lookup",
      "input": { "date": "today", "competition": "world_cup" },
      "status": "success",
      "summary": "返回 3 场比赛..."
    }
  ],
  "error": null
}
```

2. 焦点战推荐

```json
{
  "answer": "如果只看一场，我会推荐阿根廷对法国。",
  "tool_calls": [
    {
      "tool": "match_schedule_lookup",
      "input": { "date": "today", "competition": "world_cup" },
      "status": "success",
      "summary": "已获取今日全部赛程..."
    },
    {
      "tool": "match_detail_lookup",
      "input": { "match": "阿根廷 对 法国", "include": ["status", "stars"] },
      "status": "success",
      "summary": "阿根廷对法国为进行中比赛..."
    }
  ],
  "error": null
}
```

## 8. 联调建议

1. 第一阶段
   后端先保证返回：
   a. `answer`
   b. `tool_calls`
   c. `error`

2. 第二阶段
   再逐步补 `result_payload`

3. 如果接口字段要改
   a. 先在 PR 或群里说明  
   b. 明确改动前后结构  
   c. 通知前端同步调整

## 9. 当前前端代码位置

1. 查询页主逻辑  
   [QueryPage.jsx](/D:/summer.software.proj/projc/src/pages/QueryPage.jsx)

2. mock 契约数据  
   [queryMock.js](/D:/summer.software.proj/projc/src/data/queryMock.js)

3. 工具调用展示  
   [TraceInspector.jsx](/D:/summer.software.proj/projc/src/components/TraceInspector.jsx)

4. 结构化结果展示  
   [ResultShowcase.jsx](/D:/summer.software.proj/projc/src/components/ResultShowcase.jsx)
