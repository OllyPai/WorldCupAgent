import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.messages import AIMessage, ToolMessage
from langchain_deepseek import ChatDeepSeek

from tools import (
    query_best_goalkeeper,
    query_match_detail,
    query_player_stats,
    query_players,
    query_schedule,
    query_top10_scorers,
    query_top_scorer_by_team,
)


load_dotenv()


WORLD_CUP_TOOLS = [
    query_schedule,
    query_player_stats,
    query_players,
    query_match_detail,
    query_top_scorer_by_team,
    query_best_goalkeeper,
    query_top10_scorers,
]

SYSTEM_PROMPT = (
    "你是世界杯数据助手。"
    "所有赛程、球员统计、球员排行、队内最佳射手、门将扑救、比赛详情问题必须调用对应工具。"
    "工具返回是唯一事实来源；最终回答只能复述、比较或整理工具返回的字段。"
    "如果用户追问比较问题，可以结合本轮工具结果和历史对话中已经由助手返回过的工具结果。"
    "如果工具没有返回某个事实，就明确说明当前本地数据没有该字段。"
    "不要补充背景知识、历史纪录、预测、实时新闻或工具外事实。"
    "不得根据赛程自行推断球队是否参赛、晋级、出线、淘汰、止步、小组排名或战绩。"
    "如果某个球队没有查到赛程，只能说当前数据库未查询到该球队赛程。"
    "当用户询问“X和Y的比赛详情、对阵、交手”时，应查询单场比赛详情；"
    "只有用户明确说“分别”或“各自”时，才分别查询两支球队赛程。"
    "当前数据来自系统数据库。"
    "如果用户询问表现最好、最强、最佳球员等模糊评价，需要说明评价标准，优先提示可按进球、助攻或出场次数查询。"
    "如果用户询问最佳门将、门神或扑救最多门将，应调用门将扑救工具。"
)

SUPPORTED_SCOPE_ANSWER = (
    "当前系统主要支持世界杯赛程查询、球员数据查询、球员排行查询、门将扑救查询和比赛详情查询。"
    "你可以这样提问：请查询巴西队赛程；请查询梅西的世界杯进球数据；"
    "谁是进球最多的球员；请查询阿根廷和佛得角的比赛详情。"
)

AMBIGUOUS_EVALUATION_ANSWER = (
    "这个问题需要先明确评价标准。当前系统可以按进球、助攻或出场次数查询和比较球员；"
    "例如你可以问：谁进球最多？谁助攻最多？谁出场次数最多？"
)

UNSUPPORTED_INFERENCE_KEYWORDS = (
    "可能未参加",
    "可能没有参加",
    "未参加",
    "没有参加",
    "未晋级",
    "没有晋级",
    "晋级",
    "出线",
    "淘汰",
    "止步",
    "惜败",
    "落败",
    "战绩",
    "小组第一",
    "小组第二",
    "小组第三",
    "小组第四",
)


def build_agent():
    api_key = os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        raise RuntimeError("没有配置 DEEPSEEK_API_KEY")

    model = ChatDeepSeek(
        model="deepseek-v4-flash",
        api_key=api_key,
        base_url="https://api.deepseek.com",
        timeout=30,
        max_retries=2,
        extra_body={"thinking": {"type": "disabled"}},
    )

    return create_agent(
        model=model,
        tools=WORLD_CUP_TOOLS,
        system_prompt=SYSTEM_PROMPT,
    )


def _contains_meaningful_characters(text: str) -> bool:
    return any(char.isalnum() or "\u4e00" <= char <= "\u9fff" for char in text)


def _is_low_information_input(text: str) -> bool:
    compact_text = re.sub(r"\s+", "", text)

    if not _contains_meaningful_characters(compact_text):
        return True

    if re.fullmatch(r"[A-Za-z0-9_!?.,;:#@$%^&*()+=\\/-]{1,20}", compact_text):
        return compact_text.lower() not in {"hi", "hello", "help"}

    return False


def _is_obviously_unsupported_query(text: str) -> bool:
    world_cup_keywords = {
        "世界杯",
        "赛程",
        "比赛",
        "比分",
        "进球",
        "助攻",
        "出场",
        "球员",
        "球队",
        "小组赛",
        "决赛",
        "阿根廷",
        "巴西",
        "法国",
        "德国",
        "西班牙",
        "葡萄牙",
        "梅西",
        "姆巴佩",
        "C罗",
        "哈兰德",
    }
    unsupported_keywords = {
        "天气",
        "股票",
        "股价",
        "汇率",
        "翻译",
        "写代码",
        "代码",
        "论文",
        "电影",
        "菜谱",
        "旅游",
        "新闻",
    }

    return any(keyword in text for keyword in unsupported_keywords) and not any(
        keyword in text for keyword in world_cup_keywords
    )


def _is_ambiguous_player_evaluation_query(text: str) -> bool:
    ambiguous_keywords = {"表现最好", "最强", "最佳球员", "谁最好"}
    metric_keywords = {"进球", "助攻", "出场", "射手", "排名", "榜", "门将", "门神", "扑救"}

    return any(keyword in text for keyword in ambiguous_keywords) and not any(
        keyword in text for keyword in metric_keywords
    )


def _special_input_response(user_input: str) -> dict[str, Any] | None:
    text = user_input.strip()

    if _is_low_information_input(text):
        return {
            "answer": "请输入明确的世界杯查询问题，例如：请查询巴西队赛程。",
            "tool_calls": [],
            "error": "invalid_input",
            "result_payload": None,
        }

    if _is_obviously_unsupported_query(text):
        return {
            "answer": SUPPORTED_SCOPE_ANSWER,
            "tool_calls": [],
            "error": "unsupported_query",
            "result_payload": None,
        }

    if _is_ambiguous_player_evaluation_query(text):
        return {
            "answer": AMBIGUOUS_EVALUATION_ANSWER,
            "tool_calls": [],
            "error": None,
            "result_payload": None,
        }

    return None


def _extract_matchup_detail_request(text: str) -> tuple[str, str] | None:
    if "分别" in text or "各自" in text:
        return None

    normalized = text.strip()
    for prefix in ("请帮我查询", "帮我查询", "请查询", "查询", "请查看", "查看", "查一下", "请查", "查"):
        if normalized.startswith(prefix):
            normalized = normalized[len(prefix):].strip()
            break

    suffixes = (
        "的比赛详情",
        "比赛详情",
        "的对阵详情",
        "对阵详情",
        "的交手详情",
        "交手详情",
        "的对阵",
        "对阵",
        "的交手",
        "交手",
    )
    subject = None
    for suffix in suffixes:
        if normalized.endswith(suffix):
            subject = normalized[: -len(suffix)].strip()
            break

    if not subject or "和" not in subject:
        return None

    team_a, team_b = subject.split("和", 1)
    team_a = team_a.strip()
    team_b = team_b.strip()
    if not team_a or not team_b:
        return None

    return team_a, team_b


def _direct_matchup_detail_response(user_input: str) -> dict[str, Any] | None:
    matchup = _extract_matchup_detail_request(user_input)
    if matchup is None:
        return None

    home_team, away_team = matchup
    raw_result = query_match_detail.invoke(
        {"home_team": home_team, "away_team": away_team}
    )
    status, summary, data = _parse_tool_result(raw_result)
    tool_calls = [
        {
            "tool": "query_match_detail",
            "input": {"home_team": home_team, "away_team": away_team},
            "status": status,
            "summary": summary,
            "_data": data,
        }
    ]
    answer = _format_tool_answer(tool_calls)
    result_payload = _safe_build_result_payload(tool_calls)

    for call in tool_calls:
        call.pop("_data", None)

    return {
        "answer": answer,
        "tool_calls": tool_calls,
        "error": None,
        "result_payload": result_payload,
    }


def _tool_result_summary(content: Any) -> tuple[str, str]:
    status, summary, _ = _parse_tool_result(content)
    return status, summary


def _parse_tool_result(content: Any) -> tuple[str, str, Any]:
    try:
        parsed_content = json.loads(content) if isinstance(content, str) else content
    except json.JSONDecodeError:
        parsed_content = content

    if isinstance(parsed_content, dict):
        if parsed_content.get("success") is False:
            summary = str(parsed_content.get("error") or "工具调用失败")
            return "error", summary, None
        if "data" in parsed_content:
            summary = json.dumps(parsed_content["data"], ensure_ascii=False)
            return "success", summary, parsed_content["data"]

    return "success", str(content), parsed_content


def _format_schedule(data: Any) -> str:
    if not isinstance(data, list):
        return f"赛程查询结果：{json.dumps(data, ensure_ascii=False)}"

    lines = ["赛程查询结果（当前数据库）："]
    for match in data:
        if not isinstance(match, dict):
            lines.append(f"- {match}")
            continue

        score = _format_score(match.get("home_score"), match.get("away_score"))
        lines.append(
            "- "
            f"{match.get('match_date')} {match.get('match_time')}，"
            f"{match.get('stage')}，"
            f"{match.get('home_team')} {score} {match.get('away_team')}"
        )

    return "\n".join(lines)


def _format_score(home_score: Any, away_score: Any) -> str:
    if home_score is None or away_score is None:
        return "未开赛/比分待定"
    return f"{home_score}:{away_score}"


def _format_player_stats(data: Any) -> str:
    if not isinstance(data, dict):
        return f"球员数据查询结果：{json.dumps(data, ensure_ascii=False)}"

    fields = [
        ("球员", data.get("player_name")),
        ("球队", data.get("team")),
        ("进球", data.get("goals")),
        ("助攻", data.get("assists")),
        ("出场次数", data.get("appearances")),
        ("总出场分钟", data.get("total_minutes")),
        ("场均出场分钟", data.get("avg_minutes")),
        ("红牌", data.get("red_cards")),
        ("黄牌", data.get("yellow_cards")),
        ("扑救次数", data.get("saves")),
        ("扑救成功率", data.get("save_rate")),
    ]
    lines = ["球员数据查询结果（当前数据库）："]
    lines.extend(f"- {name}：{value}" for name, value in fields if value is not None)
    return "\n".join(lines)


def _format_players(data: Any) -> str:
    if not isinstance(data, dict):
        return f"球员列表查询结果：{json.dumps(data, ensure_ascii=False)}"

    players = data.get("players")
    if not isinstance(players, list):
        return f"球员列表查询结果：{json.dumps(data, ensure_ascii=False)}"

    sort_labels = {
        "goals": "进球",
        "assists": "助攻",
        "appearances": "出场次数",
    }
    sort_by = data.get("sort_by")
    sort_label = sort_labels.get(sort_by, sort_by or "统计字段")

    lines = [f"球员排行查询结果（当前数据库，按{sort_label}排序）："]
    for index, player in enumerate(players, start=1):
        if not isinstance(player, dict):
            lines.append(f"{index}. {player}")
            continue

        lines.append(
            f"{index}. {player.get('player_name')}（{player.get('team')}）："
            f"进球 {player.get('goals')}，"
            f"助攻 {player.get('assists')}，"
            f"出场 {player.get('appearances')}"
        )

    return "\n".join(lines)


def _format_top_scorer_by_team(data: Any) -> str:
    if not isinstance(data, dict):
        return f"队内射手查询结果：{json.dumps(data, ensure_ascii=False)}"

    player = data.get("top_scorer")
    if not isinstance(player, dict):
        return f"队内射手查询结果：{json.dumps(data, ensure_ascii=False)}"

    lines = [f"{data.get('team')}队内最佳射手（当前数据库）："]
    lines.append(
        f"- 球员：{player.get('player_name')}（{player.get('team')}）"
    )
    lines.append(f"- 进球：{player.get('goals')}")
    lines.append(f"- 助攻：{player.get('assists')}")
    lines.append(f"- 出场次数：{player.get('appearances')}")
    if player.get("total_minutes") is not None:
        lines.append(f"- 总出场分钟：{player.get('total_minutes')}")
    if player.get("avg_minutes") is not None:
        lines.append(f"- 场均出场分钟：{player.get('avg_minutes')}")
    return "\n".join(lines)


def _format_top10_scorers(data: Any) -> str:
    if not isinstance(data, dict):
        return f"射手榜查询结果：{json.dumps(data, ensure_ascii=False)}"

    players = data.get("top10_scorers")
    if not isinstance(players, list):
        return f"射手榜查询结果：{json.dumps(data, ensure_ascii=False)}"

    lines = ["射手榜查询结果（当前数据库，按进球排序）："]
    for index, player in enumerate(players, start=1):
        if not isinstance(player, dict):
            lines.append(f"{index}. {player}")
            continue
        lines.append(
            f"{index}. {player.get('player_name')}（{player.get('team')}）："
            f"进球 {player.get('goals')}，"
            f"助攻 {player.get('assists')}，"
            f"出场 {player.get('appearances')}"
        )
    return "\n".join(lines)


def _format_best_goalkeeper(data: Any) -> str:
    if not isinstance(data, dict):
        return f"门将扑救查询结果：{json.dumps(data, ensure_ascii=False)}"

    goalkeeper = data.get("best_goalkeeper")
    if not isinstance(goalkeeper, dict):
        return f"门将扑救查询结果：{json.dumps(data, ensure_ascii=False)}"

    lines = ["门将扑救查询结果（当前数据库）："]
    lines.append(
        f"- 门将：{goalkeeper.get('player_name')}（{goalkeeper.get('team')}）"
    )
    lines.append(f"- 扑救次数：{goalkeeper.get('saves')}")
    lines.append(f"- 扑救成功率：{goalkeeper.get('save_rate')}")
    return "\n".join(lines)


def _format_match_detail(data: Any) -> str:
    if not isinstance(data, dict):
        return f"比赛详情查询结果：{json.dumps(data, ensure_ascii=False)}"

    score = _format_score(data.get("home_score"), data.get("away_score"))
    lines = [
        "比赛详情查询结果（当前数据库）：",
        f"- 比赛ID：{data.get('match_id')}",
        f"- 时间：{data.get('match_date')} {data.get('match_time')}",
        f"- 阶段：{data.get('stage')}",
        f"- 比分：{data.get('home_team')} {score} {data.get('away_team')}",
    ]

    goals = data.get("goals")
    if isinstance(goals, list) and goals:
        lines.append("- 进球记录：")
        for goal in goals:
            if not isinstance(goal, dict):
                lines.append(f"  - {goal}")
                continue

            event_type = goal.get("event_type")
            event_label = "乌龙球" if event_type == "own_goal" else "进球"
            lines.append(
                "  - "
                f"{goal.get('goal_time')}' "
                f"{goal.get('player_name')}（{goal.get('team')}，{event_label}）"
            )

    return "\n".join(lines)


def _format_tool_error(call: dict[str, Any]) -> str:
    summary = str(call.get("summary") or "查询暂时失败，请稍后重试。")
    tool_labels = {
        "query_schedule": "赛程查询",
        "query_player_stats": "球员数据查询",
        "query_players": "球员排行查询",
        "query_match_detail": "比赛详情查询",
        "query_top_scorer_by_team": "队内射手查询",
        "query_best_goalkeeper": "门将扑救查询",
        "query_top10_scorers": "射手榜查询",
    }
    label = tool_labels.get(call["tool"])
    if label:
        return f"{label}失败：{summary}"

    return f"{call['tool']} 调用失败：{summary}"


def _format_tool_answer(tool_calls: list[dict[str, Any]]) -> str:
    sections = []

    for call in tool_calls:
        if call["status"] == "error":
            sections.append(_format_tool_error(call))
            continue

        data = call.get("_data")
        if call["tool"] == "query_schedule":
            sections.append(_format_schedule(data))
        elif call["tool"] == "query_player_stats":
            sections.append(_format_player_stats(data))
        elif call["tool"] == "query_players":
            sections.append(_format_players(data))
        elif call["tool"] == "query_match_detail":
            sections.append(_format_match_detail(data))
        elif call["tool"] == "query_top_scorer_by_team":
            sections.append(_format_top_scorer_by_team(data))
        elif call["tool"] == "query_best_goalkeeper":
            sections.append(_format_best_goalkeeper(data))
        elif call["tool"] == "query_top10_scorers":
            sections.append(_format_top10_scorers(data))
        else:
            sections.append(f"{call['tool']} 查询结果：{call['summary']}")

    return "\n\n".join(sections)


def _payload(
    mode: str,
    title: str,
    summary: str,
    source_calls: list[dict[str, Any]],
    data: Any,
) -> dict[str, Any]:
    return {
        "mode": mode,
        "title": title,
        "summary": summary,
        "source_tools": [call["tool"] for call in source_calls],
        "data": data,
    }


def _compact_dict(data: Any, fields: tuple[str, ...]) -> dict[str, Any] | None:
    if not isinstance(data, dict):
        return None

    compacted = {
        field: data[field]
        for field in fields
        if field in data and data[field] is not None
    }
    return compacted or None


PLAYER_PAYLOAD_FIELDS = (
    "player_name",
    "team",
    "goals",
    "assists",
    "appearances",
    "total_minutes",
    "avg_minutes",
    "red_cards",
    "yellow_cards",
    "saves",
    "save_rate",
)

MATCH_PAYLOAD_FIELDS = (
    "match_id",
    "match_date",
    "match_time",
    "stage",
    "home_team",
    "away_team",
    "home_score",
    "away_score",
    "goals",
)


def _compact_player(data: Any) -> dict[str, Any] | None:
    return _compact_dict(data, PLAYER_PAYLOAD_FIELDS)


def _compact_players(players: Any) -> list[dict[str, Any]]:
    if not isinstance(players, list):
        return []

    compacted_players = []
    for player in players:
        compacted = _compact_player(player)
        if compacted:
            compacted_players.append(compacted)
    return compacted_players


def _compact_match_detail(data: Any) -> dict[str, Any] | None:
    return _compact_dict(data, MATCH_PAYLOAD_FIELDS)


def _schedule_items(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    return [match for match in data if isinstance(match, dict)]


def _single_tool_payload(call: dict[str, Any]) -> dict[str, Any] | None:
    tool = call["tool"]
    data = call.get("_data")

    if tool == "query_schedule":
        matches = _schedule_items(data)
        if not matches:
            return None
        return _payload(
            "schedule",
            "赛程查询结果",
            f"共 {len(matches)} 场比赛，数据来自当前数据库。",
            [call],
            matches,
        )

    if tool == "query_player_stats":
        player = _compact_player(data)
        if not player:
            return None
        return _payload(
            "player",
            f"{player.get('player_name', '球员')}数据统计",
            "球员数据来自当前数据库。",
            [call],
            player,
        )

    if tool == "query_players":
        players = _compact_players(data.get("players") if isinstance(data, dict) else None)
        if not players:
            return None

        sort_labels = {
            "goals": "进球",
            "assists": "助攻",
            "appearances": "出场次数",
        }
        sort_by = data.get("sort_by") if isinstance(data, dict) else None
        sort_label = sort_labels.get(sort_by, sort_by or "统计字段")
        return _payload(
            "player_ranking",
            "球员排行查询结果",
            f"按{sort_label}排序，数据来自当前数据库。",
            [call],
            players,
        )

    if tool == "query_top_scorer_by_team":
        player = None
        team = None
        if isinstance(data, dict):
            player = _compact_player(data.get("top_scorer"))
            team = data.get("team") or (player or {}).get("team")
        if not player:
            return None
        return _payload(
            "player",
            f"{team or player.get('team', '')}队内最佳射手".strip(),
            "队内最佳射手数据来自当前数据库。",
            [call],
            player,
        )

    if tool == "query_best_goalkeeper":
        goalkeeper = None
        if isinstance(data, dict):
            goalkeeper = _compact_player(data.get("best_goalkeeper"))
        if not goalkeeper:
            return None
        return _payload(
            "goalkeeper",
            "门将扑救查询结果",
            "扑救次数最多的门将数据来自当前数据库。",
            [call],
            goalkeeper,
        )

    if tool == "query_top10_scorers":
        players = []
        if isinstance(data, dict):
            players = _compact_players(data.get("top10_scorers"))
        if not players:
            return None
        return _payload(
            "player_ranking",
            "射手榜前十",
            "按进球数降序排列，数据来自当前数据库。",
            [call],
            players,
        )

    if tool == "query_match_detail":
        match_detail = _compact_match_detail(data)
        if not match_detail:
            return None

        home_team = match_detail.get("home_team", "主队")
        away_team = match_detail.get("away_team", "客队")
        return _payload(
            "match_detail",
            f"{home_team} vs {away_team} 比赛详情",
            "比赛详情和进球记录来自当前数据库。",
            [call],
            match_detail,
        )

    return None


def _build_result_payload(tool_calls: list[dict[str, Any]]) -> dict[str, Any] | None:
    successful_calls = [
        call
        for call in tool_calls
        if call.get("status") == "success" and call.get("_data") is not None
    ]

    if not successful_calls:
        return None

    if len(successful_calls) == 1:
        return _single_tool_payload(successful_calls[0])

    tool_names = {call["tool"] for call in successful_calls}

    if tool_names == {"query_schedule"}:
        matches = []
        for call in successful_calls:
            matches.extend(_schedule_items(call.get("_data")))
        if not matches:
            return None
        return _payload(
            "schedule",
            "赛程查询结果",
            f"共 {len(matches)} 场比赛，数据来自当前数据库。",
            successful_calls,
            matches,
        )

    if tool_names == {"query_player_stats"}:
        players = []
        for call in successful_calls:
            player = _compact_player(call.get("_data"))
            if player:
                players.append(player)
        if not players:
            return None
        return _payload(
            "player_comparison",
            "球员数据对比",
            f"共 {len(players)} 名球员，数据来自当前数据库。",
            successful_calls,
            players,
        )

    return None


def _safe_build_result_payload(tool_calls: list[dict[str, Any]]) -> dict[str, Any] | None:
    try:
        return _build_result_payload(tool_calls)
    except Exception:
        return None


def _contains_unsupported_inference(answer: str) -> bool:
    return any(keyword in answer for keyword in UNSUPPORTED_INFERENCE_KEYWORDS)


def _is_comparison_query(text: str) -> bool:
    comparison_keywords = {"谁进球多", "谁更多", "哪个更多", "谁更高", "比较", "对比"}
    return any(keyword in text for keyword in comparison_keywords) or (
        "和" in text and "谁" in text and ("多" in text or "高" in text)
    )


def _should_use_formatter(
    user_input: str, answer: str, tool_calls: list[dict[str, Any]]
) -> bool:
    if not answer:
        return True

    if _contains_unsupported_inference(answer):
        return True

    stable_formatter_tools = {
        "query_schedule",
        "query_match_detail",
        "query_players",
        "query_top_scorer_by_team",
        "query_best_goalkeeper",
        "query_top10_scorers",
    }
    if any(call["tool"] in stable_formatter_tools for call in tool_calls):
        return True

    if all(call["tool"] == "query_player_stats" for call in tool_calls):
        return not _is_comparison_query(user_input)

    return False


def chat_with_agent(
    user_input: str,
    history: list[dict[str, str]] | None = None,
    *,
    agent: Any = None,
) -> dict[str, Any]:
    """调用 Agent，并返回供前端使用的稳定结果结构。"""
    if not user_input.strip():
        return {
            "answer": "请输入你的问题。",
            "tool_calls": [],
            "error": "user_input 不能为空",
            "result_payload": None,
        }

    special_response = _special_input_response(user_input)
    if special_response is not None:
        return special_response

    direct_response = _direct_matchup_detail_response(user_input)
    if direct_response is not None:
        return direct_response

    messages = [*(history or []), {"role": "user", "content": user_input.strip()}]

    try:
        active_agent = agent or build_agent()
        result = active_agent.invoke({"messages": messages})
    except Exception as error:
        return {
            "answer": "当前无法完成请求，请稍后重试。",
            "tool_calls": [],
            "error": str(error),
            "result_payload": None,
        }

    answer = ""
    tool_calls = []
    tool_calls_by_id = {}

    for message in result["messages"]:
        if isinstance(message, AIMessage):
            if message.content:
                answer = str(message.content)

            for call in message.tool_calls:
                record = {
                    "tool": call["name"],
                    "input": call["args"],
                    "status": "error",
                    "summary": "没有收到工具返回结果",
                }
                tool_calls.append(record)
                tool_calls_by_id[call["id"]] = record

        if isinstance(message, ToolMessage):
            record = tool_calls_by_id.get(message.tool_call_id)
            if record is not None:
                status, summary, data = _parse_tool_result(message.content)
                record["status"] = status
                record["summary"] = summary
                record["_data"] = data

    if tool_calls and _should_use_formatter(user_input, answer, tool_calls):
        answer = _format_tool_answer(tool_calls)

    result_payload = _safe_build_result_payload(tool_calls)

    for call in tool_calls:
        call.pop("_data", None)

    return {
        "answer": answer,
        "tool_calls": tool_calls,
        "error": None,
        "result_payload": result_payload,
    }


def main():
    user_input = input("你：")
    result = chat_with_agent(user_input)

    print(f"\n助手：{result['answer']}")

    for call in result["tool_calls"]:
        print(f"工具：{call['tool']} ({call['status']})")
        print(f"参数：{call['input']}")
        print(f"结果：{call['summary']}")

    if result["error"]:
        print(f"错误：{result['error']}")


if __name__ == "__main__":
    main()
