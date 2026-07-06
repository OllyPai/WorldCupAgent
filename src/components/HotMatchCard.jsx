import { Card, Tag } from "antd";

function HotMatchCard({ match }) {
  return (
    <Card className="hot-match-card" bordered={false}>
      <div className="hot-card-top">
        <Tag color="cyan">{match.heat}</Tag>
        <span className="hot-stage">{match.stage}</span>
      </div>

      <div className="hot-card-score">
        <div className="hot-team">{match.homeTeam}</div>
        <div className="hot-score-center">
          <span>{match.homeScore}</span>
          <span className="score-divider">:</span>
          <span>{match.awayScore}</span>
        </div>
        <div className="hot-team align-right">{match.awayTeam}</div>
      </div>

      <div className="hot-card-bottom">
        <Tag color="green">{match.status}</Tag>
        <span>{match.matchTime}</span>
      </div>

      <p>{match.summary}</p>
    </Card>
  );
}

export default HotMatchCard;
