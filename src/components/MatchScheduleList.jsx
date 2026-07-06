import { Card, Tag } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

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
            <div className="team-row">
              <span>{match.homeTeam}</span>
              <strong>{match.homeScore}</strong>
            </div>
            <div className="team-row">
              <span>{match.awayTeam}</span>
              <strong>{match.awayScore}</strong>
            </div>
          </div>

          <div className="schedule-meta">
            <span>
              <ClockCircleOutlined /> {match.matchTime}
            </span>
            <span>{match.stadium}</span>
          </div>

          <p className="schedule-highlight">{match.highlight}</p>
        </Card>
      ))}
    </div>
  );
}

export default MatchScheduleList;
