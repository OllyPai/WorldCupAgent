import {
  featuredMatches,
  goalEvents,
  quickQueries,
  todayMatches,
} from "./homeMock";

const teamMeta = {
  Argentina: { flag: "🇦🇷", code: "ARG" },
  France: { flag: "🇫🇷", code: "FRA" },
  Brazil: { flag: "🇧🇷", code: "BRA" },
  Spain: { flag: "🇪🇸", code: "ESP" },
  Germany: { flag: "🇩🇪", code: "GER" },
  Portugal: { flag: "🇵🇹", code: "POR" },
};

const playerAvatarMap = {
  Messi: "M",
  Alvarez: "A",
  Mbappe: "MB",
};

const formatTeam = (name) => ({
  name,
  ...(teamMeta[name] ?? { flag: "🏳️", code: name.slice(0, 3).toUpperCase() }),
});

const argentinaFranceMatch = todayMatches[0];

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
    label: "今天有哪些比赛",
    placeholder: "例如：今天有哪些世界杯比赛？",
    request: {
      user_input: quickQueries[0].queryText,
      history: [],
    },
    response: {
      answer:
        "今天共有 3 场世界杯比赛，当前最值得关注的是阿根廷 vs 法国，比赛正在进行中。",
      tool_calls: [
        buildToolCall(
          "match_schedule_lookup",
          { date: "today", competition: "world_cup" },
          "success",
          "返回 3 场比赛，包含 1 场进行中、1 场未开始、1 场已结束。"
        ),
      ],
      error: null,
      result_payload: {
        mode: "schedule",
        title: "今日世界杯赛程",
        summary: "共返回 3 场比赛，包含进行中、未开始和已结束三种状态。",
        rows: todayMatches.map((match) => ({
          key: match.id,
          stage: match.stage,
          homeTeam: formatTeam(match.homeTeam),
          awayTeam: formatTeam(match.awayTeam),
          time: match.matchTime,
          score: `${match.homeScore} : ${match.awayScore}`,
          status: match.status,
          stadium: match.stadium,
        })),
      },
    },
  },
  {
    id: "query-02",
    label: "阿根廷比分",
    placeholder: "例如：阿根廷现在比分是多少？",
    request: {
      user_input: quickQueries[1].queryText,
      history: [],
    },
    response: {
      answer:
        "阿根廷当前 2 比 1 领先法国，比赛正在进行中，已进入下半场。",
      tool_calls: [
        buildToolCall(
          "live_score_lookup",
          { team: "Argentina", scope: "today" },
          "success",
          "匹配到阿根廷 vs 法国，当前比分为 2 : 1。"
        ),
      ],
      error: null,
      result_payload: {
        mode: "scorecard",
        title: "阿根廷实时比分卡",
        summary: "当前阿根廷对阵法国，阿根廷 2 比 1 领先。",
        match: {
          ...argentinaFranceMatch,
          homeTeam: formatTeam(argentinaFranceMatch.homeTeam),
          awayTeam: formatTeam(argentinaFranceMatch.awayTeam),
        },
        stats: [
          { label: "比赛状态", value: "进行中" },
          { label: "领先方", value: "Argentina" },
          { label: "最近进球", value: "Mbappe 52'" },
          { label: "比赛阶段", value: argentinaFranceMatch.stage },
        ],
      },
    },
  },
  {
    id: "query-03",
    label: "谁进球了",
    placeholder: "例如：阿根廷对法国这场谁进球了？",
    request: {
      user_input: quickQueries[2].queryText,
      history: [],
    },
    response: {
      answer:
        "目前这场比赛的进球球员有 Messi、Alvarez 和 Mbappe，其中阿根廷 2 球，法国 1 球。",
      tool_calls: [
        buildToolCall(
          "match_detail_lookup",
          { match: "Argentina vs France", include: ["goals"] },
          "success",
          "返回 3 条进球事件：Messi、Alvarez、Mbappe 各进 1 球。"
        ),
      ],
      error: null,
      result_payload: {
        mode: "events",
        title: "比赛进球事件",
        summary: "共 3 个进球事件，支持球员、时间和所属球队展示。",
        match: {
          homeTeam: formatTeam(argentinaFranceMatch.homeTeam),
          awayTeam: formatTeam(argentinaFranceMatch.awayTeam),
        },
        events: goalEvents.map((event) => ({
          ...event,
          avatar: playerAvatarMap[event.playerName] ?? event.playerName.slice(0, 1),
          team: formatTeam(event.teamName),
        })),
      },
    },
  },
  {
    id: "query-04",
    label: "焦点战推荐",
    placeholder: "例如：今天最值得看的比赛是哪一场？",
    request: {
      user_input: quickQueries[3].queryText,
      history: [],
    },
    response: {
      answer:
        "如果只看一场，我会推荐阿根廷 vs 法国。这场已经开打，而且梅西与姆巴佩的对位很有看点。",
      tool_calls: [
        buildToolCall(
          "match_schedule_lookup",
          { date: "today", competition: "world_cup" },
          "success",
          "已获取今日全部赛程，并筛出焦点比赛候选。"
        ),
        buildToolCall(
          "match_detail_lookup",
          { match: "Argentina vs France", include: ["status", "stars"] },
          "success",
          "阿根廷 vs 法国为进行中比赛，且具备明显球星对位与观赛价值。"
        ),
      ],
      error: null,
      result_payload: {
        mode: "recommendation",
        title: "今日焦点战推荐",
        summary: "按热度和观赛价值排序，推荐优先观看阿根廷 vs 法国。",
        cards: featuredMatches.map((match, index) => ({
          ...match,
          rank: index + 1,
          homeTeam: formatTeam(match.homeTeam),
          awayTeam: formatTeam(match.awayTeam),
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

export function resolveMockCaseByQuestion(question) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("谁进球") ||
    normalized.includes("goal") ||
    normalized.includes("进球")
  ) {
    return queryCaseMap["query-03"];
  }

  if (
    normalized.includes("比分") ||
    normalized.includes("score") ||
    normalized.includes("阿根廷")
  ) {
    return queryCaseMap["query-02"];
  }

  if (
    normalized.includes("值得看") ||
    normalized.includes("推荐") ||
    normalized.includes("焦点")
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
