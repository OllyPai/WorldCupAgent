import { Card, Tag } from "antd";
import TeamIdentity from "./TeamIdentity";

function HotMatchCard({ match }) {
  return (
    <Card className="hot-match-card" bordered={false}>
      <div className="hot-card-top">
        <span className="hot-stage">{match.stage}</span>
      </div>

      <div className="hot-card-score">
        <TeamIdentity teamName={match.homeTeam} compact />
        <div className="hot-score-center">
          <span>{match.homeScore}</span>
          <span className="score-divider">:</span>
          <span>{match.awayScore}</span>
        </div>
        <TeamIdentity teamName={match.awayTeam} align="right" compact />
      </div>

      <div className="hot-card-bottom">
        <Tag color="green">{match.status}</Tag>
        <span>{match.matchTime}</span>
      </div>
    </Card>
  );
}

export default HotMatchCard;
