export const todayMatches = [
  {
    id: "match-01",
    homeTeam: "阿根廷",
    awayTeam: "法国",
    matchTime: "19:00",
    status: "进行中",
    homeScore: 2,
    awayScore: 1,
    stage: "半决赛",
    stadium: "卢赛尔体育场",
    highlight: "阿根廷上半场主动压迫，法国依靠反击追回一球。",
  },
  {
    id: "match-02",
    homeTeam: "巴西",
    awayTeam: "西班牙",
    matchTime: "22:00",
    status: "未开始",
    homeScore: 0,
    awayScore: 0,
    stage: "四分之一决赛",
    stadium: "海湾球场",
    highlight: "双边路强强对话，控球与反击的经典碰撞。",
  },
  {
    id: "match-03",
    homeTeam: "德国",
    awayTeam: "葡萄牙",
    matchTime: "01:00",
    status: "已结束",
    homeScore: 3,
    awayScore: 2,
    stage: "八分之一决赛",
    stadium: "教育城体育场",
    highlight: "德国终场前完成绝杀，比赛节奏极快。",
  },
];

export const featuredMatches = [
  {
    id: "featured-01",
    homeTeam: "阿根廷",
    awayTeam: "法国",
    matchTime: "19:00",
    status: "进行中",
    homeScore: 2,
    awayScore: 1,
    stage: "半决赛",
    heat: "全场焦点",
    summary: "梅西与姆巴佩正面对决，比赛强度拉满。",
  },
  {
    id: "featured-02",
    homeTeam: "巴西",
    awayTeam: "西班牙",
    matchTime: "22:00",
    status: "30 分钟后开赛",
    homeScore: 0,
    awayScore: 0,
    stage: "四分之一决赛",
    heat: "战术焦点",
    summary: "巴西边路突破对西班牙中场控制，战术看点十足。",
  },
  {
    id: "featured-03",
    homeTeam: "德国",
    awayTeam: "葡萄牙",
    matchTime: "已结束",
    status: "赛后回顾",
    homeScore: 3,
    awayScore: 2,
    stage: "八分之一决赛",
    heat: "绝杀时刻",
    summary: "最后 10 分钟连进两球，逆转剧情非常适合做赛后复盘。",
  },
];

export const goalEvents = [
  {
    id: "goal-01",
    matchId: "match-01",
    teamName: "阿根廷",
    playerName: "梅西",
    minute: "12'",
    goalType: "点球",
  },
  {
    id: "goal-02",
    matchId: "match-01",
    teamName: "阿根廷",
    playerName: "阿尔瓦雷斯",
    minute: "37'",
    goalType: "运动战",
  },
  {
    id: "goal-03",
    matchId: "match-01",
    teamName: "法国",
    playerName: "姆巴佩",
    minute: "52'",
    goalType: "反击破门",
  },
];

export const quickQueries = [
  {
    id: "query-01",
    label: "今天有哪些比赛",
    queryText: "今天有哪些世界杯比赛？",
  },
  {
    id: "query-02",
    label: "阿根廷比分",
    queryText: "阿根廷现在比分是多少？",
  },
  {
    id: "query-03",
    label: "谁进球了",
    queryText: "阿根廷对法国这场谁进球了？",
  },
  {
    id: "query-04",
    label: "焦点战推荐",
    queryText: "今天最值得看的比赛是哪一场？",
  },
];

export const agentTraces = {
  "query-01": {
    id: "trace-01",
    userQuestion: "今天有哪些世界杯比赛？",
    intent: "查询今日赛程",
    toolName: "match_schedule_lookup",
    toolParams: "date=today, competition=world_cup",
    toolResultSummary: "返回 3 场比赛，包含 1 场进行中、1 场未开始、1 场已结束。",
    finalAnswer:
      "今天共有 3 场世界杯比赛，当前最值得关注的是阿根廷对法国，比赛正在进行中。",
    steps: [
      "识别用户是在问今日赛程",
      "调用赛程查询工具获取全部比赛",
      "整理状态并筛出进行中的焦点战",
      "生成简洁回答并突出重点",
    ],
  },
  "query-02": {
    id: "trace-02",
    userQuestion: "阿根廷现在比分是多少？",
    intent: "查询指定球队实时比分",
    toolName: "live_score_lookup",
    toolParams: "team=阿根廷, scope=today",
    toolResultSummary: "匹配到阿根廷对法国，当前比分为 2 : 1。",
    finalAnswer:
      "阿根廷当前 2 比 1 领先法国，比赛正在进行中，已进入下半场。",
    steps: [
      "识别球队实体为阿根廷",
      "调用实时比分工具查询当天比赛",
      "确认阿根廷为主队并提取当前比分",
      "补充比赛状态后生成回答",
    ],
  },
  "query-03": {
    id: "trace-03",
    userQuestion: "阿根廷对法国这场谁进球了？",
    intent: "查询比赛进球事件",
    toolName: "goal_event_lookup",
    toolParams: "match=阿根廷 对 法国",
    toolResultSummary:
      "返回 3 条进球事件：梅西、阿尔瓦雷斯、姆巴佩各进 1 球。",
    finalAnswer:
      "目前这场比赛的进球球员有梅西、阿尔瓦雷斯和姆巴佩，其中阿根廷 2 球，法国 1 球。",
    steps: [
      "识别出具体比赛对阵",
      "调用进球事件查询工具",
      "按球队和球员汇总进球信息",
      "输出球员名单与比分关系",
    ],
  },
  "query-04": {
    id: "trace-04",
    userQuestion: "今天最值得看的比赛是哪一场？",
    intent: "查询焦点赛事推荐",
    toolName: "featured_match_selector",
    toolParams: "date=today, preference=drama_and_star",
    toolResultSummary:
      "根据比赛热度、球星标签和实时状态，推荐阿根廷对法国。",
    finalAnswer:
      "如果只看一场，我会推荐阿根廷对法国。这场已经开打，而且梅西与姆巴佩的对位很有看点。",
    steps: [
      "理解用户要的是推荐而不是纯查询",
      "调用焦点赛事选择工具",
      "综合热度、球星与比赛状态排序",
      "生成带理由的推荐回答",
    ],
  },
};
