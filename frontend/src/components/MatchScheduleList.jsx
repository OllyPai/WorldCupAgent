import { Card, Tag } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import TeamIdentity from "./TeamIdentity";

function MatchScheduleList({ matches }) {
  return (
    <div className="schedule-list">
      {matches.map((match) => (
        <Card className="schedule-card" key={match.id} bordered={false}>
          <div className="schedule-card-top">
            <Tag color="green">{match.stage}</Tag>
            <Tag color={match.status === "进行中" ? "red" : "default"}>
              {match.status}
            </Tag>
          </div>

          <div className="schedule-teams">
            <div className="schedule-versus-badge">VS</div>
            <div className="team-row">
              <TeamIdentity teamName={match.homeTeam} compact />
              <strong>{match.homeScore}</strong>
            </div>
            <div className="team-row">
              <TeamIdentity teamName={match.awayTeam} compact />
              <strong>{match.awayScore}</strong>
            </div>
          </div>

          <div className="schedule-meta">
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
