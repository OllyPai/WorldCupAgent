import { Card, Empty, Tag } from "antd";
import FormattedText from "./FormattedText";
import MatchScheduleList from "./MatchScheduleList";
import PlayerSpotlightGrid from "./PlayerSpotlightGrid";
import TeamIdentity from "./TeamIdentity";

function getLocalDateTimeKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function inferMatchStatus(match) {
  if (match.status) return match.status;

  if (match.home_score === null || match.away_score === null) {
    return "未开始";
  }

  if (match.match_date && match.match_time) {
    const matchDateTime = `${match.match_date} ${match.match_time}`;
    return matchDateTime > getLocalDateTimeKey() ? "未开始" : "已结束";
  }

  return "已结束";
}

function formatEventTag(eventType) {
  if (eventType === "own_goal" || eventType === "乌龙球") {
    return "OG";
  }

  return "⚽";
}

function renderResultSection(result, fallbackAnswer = "") {
  const { mode, data } = result;

  if (mode === "schedule") {
    const mappedMatches = (Array.isArray(data) ? data : []).map((m, idx) => ({
      id: `real-match-${idx}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      homeScore: m.home_score,
      awayScore: m.away_score,
      matchDate: m.match_date,
      matchTime: m.match_time,
      stage: m.stage,
      status: inferMatchStatus(m),
    }));
    return <MatchScheduleList matches={mappedMatches} />;
  }

  if (mode === "player") {
    const mappedPlayers = [
      {
        id: `real-player-${data.player_name}`,
        playerName: data.player_name,
        teamName: data.team,
        goals: data.goals,
        assists: data.assists,
        appearances: data.appearances,
      },
    ];
    return <PlayerSpotlightGrid players={mappedPlayers} />;
  }

  if (mode === "match_detail") {
    return (
      <div className="match-detail-realtime">
        <div className="match-detail-header">
          <div className="match-detail-main-row">
            <TeamIdentity teamName={data.home_team} />
            <div className="match-detail-score">
              <span>{data.home_score}</span>
              <span className="score-divider">:</span>
              <span>{data.away_score}</span>
            </div>
            <TeamIdentity teamName={data.away_team} align="right" />
          </div>
          <div className="match-detail-meta">
            <Tag color="blue">{data.stage}</Tag>
            <span>{data.match_date} {data.match_time}</span>
          </div>
        </div>

        {data.goals && data.goals.length > 0 && (
          <div className="match-detail-goals">
            <h4>进球记录</h4>
            <div className="goal-list">
              {data.goals.map((g, idx) => (
                <div
                  key={idx}
                  className={`goal-item ${g.team === data.home_team ? "is-home" : "is-away"}`}
                >
                  <span className="goal-time">{g.goal_time}'</span>
                  <span className="goal-player">{g.player_name}</span>
                  <Tag size="small">{formatEventTag(g.event_type)}</Tag>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="query-answer-fallback-box">
      <FormattedText text={result.content ?? fallbackAnswer} />
    </div>
  );
}

function ResultShowcase({ result, fallbackAnswer = "" }) {
  if (!result) {
    return (
      <Card className="query-result-card" bordered={false}>
        {fallbackAnswer ? (
          <div className="query-answer-fallback">
            <div className="section-headline result-headline">
              <span className="section-kicker">查询结果</span>
              <h3>系统回答</h3>
              <p>以下内容来自智能体调用工具后的整理结果。</p>
            </div>
            <div className="query-answer-fallback-box">
              <FormattedText text={fallbackAnswer} />
            </div>
          </div>
        ) : (
          <Empty description="发起查询后，这里将显示查询结果" />
        )}
      </Card>
    );
  }

  return (
    <Card className="query-result-card" bordered={false}>
      <div className="section-headline result-headline">
        <span className="section-kicker">查询结果</span>
        <h3>{result.title ?? "查询结果"}</h3>
        <p>{result.summary ?? "以下结果由后端智能体调用工具后生成。"}</p>
      </div>
      {result.mode === "multi" && Array.isArray(result.sections) ? (
        <div className="query-result-sections">
          {result.sections.map((section) => (
            <section
              key={section.id ?? section.title}
              className="query-result-section"
            >
              <div className="query-result-section-head">
                <h4>{section.title ?? "结果分段"}</h4>
              </div>
              {renderResultSection(section, fallbackAnswer)}
            </section>
          ))}
        </div>
      ) : (
        renderResultSection(result, fallbackAnswer)
      )}
    </Card>
  );
}

export default ResultShowcase;
