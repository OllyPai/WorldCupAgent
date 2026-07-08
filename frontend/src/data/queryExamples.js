import {
  featuredMatches,
  goalEvents,
  quickQueries,
  todayMatches,
} from "./homeMock";

const teamMeta = {
  巴西: { flag: "🇧🇷", code: "BRA" },
  挪威: { flag: "🇳🇴", code: "NOR" },
  葡萄牙: { flag: "🇵🇹", code: "POR" },
  西班牙: { flag: "🇪🇸", code: "ESP" },
  阿根廷: { flag: "🇦🇷", code: "ARG" },
  佛得角: { flag: "🇨🇻", code: "CPV" },
  埃及: { flag: "🇪🇬", code: "EGY" },
  摩洛哥: { flag: "🇲🇦", code: "MAR" },
  海地: { flag: "🇭🇹", code: "HAI" },
  苏格兰: { flag: "🏴", code: "SCO" },
};

const playerAvatarMap = {
  梅西: "梅",
  哈兰德: "哈",
  内马尔: "内",
  "德罗伊·杜阿尔特": "杜",
  "利桑德罗·马丁内斯": "马",
  "洛佩斯·卡布拉尔": "卡",
  "迪内·博尔热斯": "博",
};

const formatTeam = (name) => ({
  name,
  ...(teamMeta[name] ?? { flag: "🏳️", code: name.slice(0, 3).toUpperCase() }),
});

const brazilScheduleRows = [
  {
    key: "brazil-13",
    stage: "小组赛C组",
    homeTeam: formatTeam("巴西"),
    awayTeam: formatTeam("摩洛哥"),
    time: "2026-06-14 06:00",
    score: "1 : 1",
    status: "本地库记录",
    stadium: "本地演示库未提供场馆",
  },
  {
    key: "brazil-16",
    stage: "小组赛C组",
    homeTeam: formatTeam("巴西"),
    awayTeam: formatTeam("海地"),
    time: "2026-06-20 08:30",
    score: "3 : 0",
    status: "本地库记录",
    stadium: "本地演示库未提供场馆",
  },
  {
    key: "brazil-91",
    stage: "1/8决赛",
    homeTeam: formatTeam("巴西"),
    awayTeam: formatTeam("挪威"),
    time: "2026-07-06 04:00",
    score: "1 : 2",
    status: "本地库记录",
    stadium: "本地演示库未提供场馆",
  },
];

const argentinaCapeVerdeMatch = {
  id: "match-87",
  homeTeam: "阿根廷",
  awayTeam: "佛得角",
  matchDate: "2026-07-04",
  matchTime: "06:00",
  status: "本地库记录",
  homeScore: 3,
  awayScore: 2,
  stage: "1/16决赛",
};

const argentinaCapeVerdeEvents = [
  {
    id: "event-87-01",
    teamName: "阿根廷",
    playerName: "梅西",
    minute: "29'",
    goalType: "进球",
  },
  {
    id: "event-87-02",
    teamName: "佛得角",
    playerName: "德罗伊·杜阿尔特",
    minute: "59'",
    goalType: "进球",
  },
  {
    id: "event-87-03",
    teamName: "阿根廷",
    playerName: "利桑德罗·马丁内斯",
    minute: "92'",
    goalType: "进球",
  },
  {
    id: "event-87-04",
    teamName: "佛得角",
    playerName: "洛佩斯·卡布拉尔",
    minute: "103'",
    goalType: "进球",
  },
  {
    id: "event-87-05",
    teamName: "佛得角",
    playerName: "迪内·博尔热斯",
    minute: "111'",
    goalType: "乌龙球",
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
        rows: brazilScheduleRows,
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
        "球员数据查询结果（本地课程演示数据库）：\n- 球员：梅西\n- 球队：阿根廷\n- 进球：7\n- 助攻：3\n- 出场次数：5",
      tool_calls: [
        buildToolCall(
          "query_player_stats",
          { player_name: "梅西" },
          "success",
          '{"player_name":"梅西","team":"阿根廷","goals":7,"assists":3,"appearances":5}'
        ),
      ],
      error: null,
      result_payload: {
        mode: "scorecard",
        title: "梅西本地演示统计",
        summary: "字段来自 players 表：球队、进球、助攻、出场次数。",
        match: {
          homeTeam: formatTeam("梅西"),
          awayTeam: formatTeam("阿根廷"),
          homeScore: 7,
          awayScore: 3,
          stage: "进球 : 助攻",
        },
        stats: [
          { label: "球队", value: "阿根廷" },
          { label: "进球", value: "7" },
          { label: "助攻", value: "3" },
          { label: "出场次数", value: "5" },
        ],
      },
    },
  },
  {
    id: "query-03",
    label: "比赛详情",
    placeholder: "例如：请查询阿根廷和佛得角的比赛详情",
    request: {
      user_input: quickQueries[2].queryText,
      history: [],
    },
    response: {
      answer:
        "比赛详情查询结果（本地课程演示数据库）：阿根廷 3:2 佛得角，并包含进球事件。",
      tool_calls: [
        buildToolCall(
          "query_match_detail",
          { home_team: "阿根廷", away_team: "佛得角" },
          "success",
          "返回 match_id=87 的比分和进球事件。"
        ),
      ],
      error: null,
      result_payload: {
        mode: "events",
        title: "阿根廷 vs 佛得角进球事件",
        summary: "共 5 条进球事件，数据来自本地 SQLite 演示库。",
        match: {
          homeTeam: formatTeam(argentinaCapeVerdeMatch.homeTeam),
          awayTeam: formatTeam(argentinaCapeVerdeMatch.awayTeam),
        },
        events: argentinaCapeVerdeEvents.map((event) => ({
          ...event,
          avatar: playerAvatarMap[event.playerName] ?? event.playerName.slice(0, 1),
          team: formatTeam(event.teamName),
        })),
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
    normalized.includes("佛得角") ||
    normalized.includes("阿根廷")
  ) {
    return queryCaseMap["query-03"];
  }

  if (
    normalized.includes("葡萄牙") ||
    normalized.includes("西班牙")
  ) {
    return queryCaseMap["query-04"];
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
