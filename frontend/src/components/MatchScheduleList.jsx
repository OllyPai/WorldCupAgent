import { Card, Tag } from "antd";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import TeamIdentity from "./TeamIdentity";

function getStatusColor(status) {
  if (status === "进行中") return "red";
  if (status === "未开始") return "blue";
  if (status === "已结束") return "default";
  return "green";
}

function formatScore(score, status) {
  if (status === "未开始" || score === null || score === undefined) {
    return "—";
  }

  return score;
}

function MatchScheduleList({ matches }) {
  return (
    <div className="schedule-list">
      {matches.map((match) => (
        <Card className="schedule-card" key={match.id} bordered={false}>
          <div className="schedule-card-top">
            <Tag color="green">{match.stage}</Tag>
            <Tag color={getStatusColor(match.status)}>
              {match.status}
            </Tag>
          </div>

          <div className="schedule-teams">
            <div className="schedule-versus-badge">VS</div>
            <div className="team-row">
              <TeamIdentity teamName={match.homeTeam} compact />
              <strong>{formatScore(match.homeScore, match.status)}</strong>
            </div>
            <div className="team-row">
              <TeamIdentity teamName={match.awayTeam} compact />
              <strong>{formatScore(match.awayScore, match.status)}</strong>
            </div>
          </div>

          <div className="schedule-meta">
            {match.matchDate ? (
              <span>
                <CalendarOutlined /> {match.matchDate}
              </span>
            ) : null}
            <span>
              <ClockCircleOutlined /> {match.matchTime}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default MatchScheduleList;
