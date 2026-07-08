import { Card, Empty, Tag } from "antd";
import MatchScheduleList from "./MatchScheduleList";
import PlayerSpotlightGrid from "./PlayerSpotlightGrid";
import TeamIdentity from "./TeamIdentity";

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
              <p>{fallbackAnswer}</p>
            </div>
          </div>
        ) : (
          <Empty description="发起查询后，这里将显示查询结果" />
        )}
      </Card>
    );
  }

  // 实时数据渲染逻辑
  const renderContent = () => {
    const { mode, data } = result;

    if (mode === "schedule") {
      // 字段映射：后端(snake_case) -> 组件(camelCase)
      const mappedMatches = (Array.isArray(data) ? data : []).map((m, idx) => ({
        id: `real-match-${idx}`,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        homeScore: m.home_score,
        awayScore: m.away_score,
        matchTime: m.match_time,
        stage: m.stage,
        status: "已结束", // 演示库数据默认为已结束
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
                  <div key={idx} className={`goal-item ${g.team === data.home_team ? "is-home" : "is-away"}`}>
                    <span className="goal-time">{g.goal_time}'</span>
                    <span className="goal-player">{g.player_name}</span>
                    <Tag size="small">{g.event_type === "进球" ? "⚽" : "OG"}</Tag>
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
        <p>{result.content ?? fallbackAnswer}</p>
      </div>
    );
  };

  return (
    <Card className="query-result-card" bordered={false}>
      <div className="section-headline result-headline">
        <span className="section-kicker">查询结果</span>
        <h3>{result.title ?? "查询结果"}</h3>
        <p>{result.summary ?? "以下结果由后端智能体调用工具后生成。"}</p>
      </div>
      {renderContent()}
    </Card>
  );
}

export default ResultShowcase;
