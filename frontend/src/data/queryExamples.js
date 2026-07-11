import { quickQueries } from "./homeMock";

const messiStatsData = {
  player_name: "利昂内尔・梅西",
  team: "阿根廷",
  goals: 8,
  assists: 1,
  appearances: 5,
  total_minutes: 411,
  avg_minutes: 82.2,
  red_cards: 0,
  yellow_cards: 0,
};

const brazilScheduleData = [
  {
    match_date: "2026-06-14",
    match_time: "06:00",
    home_team: "巴西",
    away_team: "摩洛哥",
    stage: "小组赛C组",
    home_score: 1,
    away_score: 1,
  },
  {
    match_date: "2026-06-20",
    match_time: "08:30",
    home_team: "巴西",
    away_team: "海地",
    stage: "小组赛C组",
    home_score: 3,
    away_score: 0,
  },
  {
    match_date: "2026-06-25",
    match_time: "06:00",
    home_team: "苏格兰",
    away_team: "巴西",
    stage: "小组赛C组",
    home_score: 0,
    away_score: 3,
  },
  {
    match_date: "2026-06-30",
    match_time: "01:00",
    home_team: "巴西",
    away_team: "日本",
    stage: "1/16决赛",
    home_score: 2,
    away_score: 1,
  },
  {
    match_date: "2026-07-06",
    match_time: "04:00",
    home_team: "巴西",
    away_team: "挪威",
    stage: "1/8决赛",
    home_score: 1,
    away_score: 2,
  },
];

const spainBelgiumMatch = {
  id: "match-98",
  homeTeam: "西班牙",
  awayTeam: "比利时",
  matchDate: "2026-07-11",
  matchTime: "03:00",
  status: "本地库记录",
  homeScore: 2,
  awayScore: 1,
  stage: "1/4决赛",
};

const spainBelgiumEvents = [
  {
    id: "event-98-01",
    teamName: "西班牙",
    playerName: "鲁伊斯",
    minute: "30'",
    goalType: "进球",
  },
  {
    id: "event-98-02",
    teamName: "比利时",
    playerName: "德凯特拉雷",
    minute: "41'",
    goalType: "进球",
  },
  {
    id: "event-98-03",
    teamName: "西班牙",
    playerName: "梅里诺",
    minute: "88'",
    goalType: "进球",
  },
];

function buildHistory(userInput, answer) {
  return [
    { role: "user", content: userInput },
    { role: "assistant", content: answer },
  ];
}

function buildToolCall(tool, input, status, summary) {
  return { tool, input, status, summary };
}

function buildMessageFeed(userInput, answer, note) {
  return [
    {
      id: `user-${userInput}`,
      role: "user",
      content: userInput,
    },
    {
      id: `assistant-${userInput}`,
      role: "assistant",
      content: answer,
      note,
    },
  ];
}

const queryCases = [
  {
    id: "query-01",
    label: "赛程",
    placeholder: "例如：请查询巴西队赛程",
    request: {
      user_input: quickQueries[0].queryText,
      history: [],
    },
    response: {
      answer:
        "巴西队赛程查询结果来自本地 SQLite 课程演示数据库，包含小组赛和淘汰赛记录。",
      tool_calls: [
        buildToolCall(
          "query_schedule",
          { team: "巴西" },
          "success",
          "返回巴西队相关赛程记录。"
        ),
      ],
      error: null,
      result_payload: {
        mode: "schedule",
        title: "巴西队本地演示赛程",
        summary: "以下为 tools/worldcup.db 中的演示数据，不代表官方实时数据。",
        source_tools: ["query_schedule"],
        data: brazilScheduleData,
      },
    },
  },
  {
    id: "query-02",
    label: "球员数据",
    placeholder: "例如：请查询梅西的世界杯进球数据",
    request: {
      user_input: quickQueries[1].queryText,
      history: [],
    },
    response: {
      answer:
        "球员数据查询结果（本地课程演示数据库）：\n- 球员：利昂内尔・梅西\n- 球队：阿根廷\n- 进球：8\n- 助攻：1\n- 出场次数：5",
      tool_calls: [
        buildToolCall(
          "query_player_stats",
          { player_name: "梅西" },
          "success",
          JSON.stringify(messiStatsData)
        ),
      ],
      error: null,
      result_payload: {
        mode: "player",
        title: "梅西本地演示统计",
        summary: "字段来自 players 表：球队、进球、助攻、出场次数。",
        source_tools: ["query_player_stats"],
        data: messiStatsData,
      },
    },
  },
  {
    id: "query-03",
    label: "比赛详情",
    placeholder: "例如：请查询西班牙和比利时的比赛详情",
    request: {
      user_input: quickQueries[2].queryText,
      history: [],
    },
    response: {
      answer:
        "比赛详情查询结果（本地课程演示数据库）：西班牙 2:1 比利时，并包含进球事件。",
      tool_calls: [
        buildToolCall(
          "query_match_detail",
          { home_team: "西班牙", away_team: "比利时" },
          "success",
          "返回 match_id=98 的比分和进球事件。"
        ),
      ],
      error: null,
      result_payload: {
        mode: "match_detail",
        title: "西班牙 vs 比利时进球事件",
        summary: "共 3 条进球事件，数据来自本地 SQLite 演示库。",
        source_tools: ["query_match_detail"],
        data: {
          match_id: 98,
          match_date: spainBelgiumMatch.matchDate,
          match_time: spainBelgiumMatch.matchTime,
          home_team: spainBelgiumMatch.homeTeam,
          away_team: spainBelgiumMatch.awayTeam,
          stage: spainBelgiumMatch.stage,
          home_score: spainBelgiumMatch.homeScore,
          away_score: spainBelgiumMatch.awayScore,
          goals: spainBelgiumEvents.map((event) => ({
            player_name: event.playerName,
            team: event.teamName,
            goal_time: Number(event.minute.replace("'", "")),
            event_type: event.goalType === "乌龙球" ? "own_goal" : "goal",
          })),
        },
      },
    },
  },

];

export const querySuggestions = quickQueries;
export const queryCaseMap = Object.fromEntries(
  queryCases.map((queryCase) => [queryCase.id, queryCase])
);

export function getQueryCase(caseId) {
  return queryCaseMap[caseId] ?? queryCases[0];
}

export function getQueryCases() {
  return queryCases;
}

export function resolveExampleCaseByQuestion(question) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("梅西") ||
    normalized.includes("球员") ||
    normalized.includes("进球数据")
  ) {
    return queryCaseMap["query-02"];
  }

  if (
    normalized.includes("埃及") ||
    normalized.includes("佛得角") ||
    normalized.includes("阿根廷")
  ) {
    return queryCaseMap["query-03"];
  }

  if (
    normalized.includes("葡萄牙") ||
    normalized.includes("西班牙")
  ) {
    return queryCaseMap["query-03"];
  }

  return queryCaseMap["query-01"];
}

export function buildConversationState(queryCase) {
  return {
    draft: queryCase.request.user_input,
    history: buildHistory(queryCase.request.user_input, queryCase.response.answer),
    messages: buildMessageFeed(
      queryCase.request.user_input,
      queryCase.response.answer,
      queryCase.response.result_payload?.summary ?? queryCase.response.answer
    ),
    response: queryCase.response,
  };
}

export function buildMockAgentPayload(userInput, history, queryCase) {
  return {
    request: {
      user_input: userInput,
      history,
    },
    response: queryCase.response,
  };
}
