import { Card } from "antd";
import TeamIdentity from "./TeamIdentity";

function PlayerSpotlightGrid({ players }) {
  return (
    <div className="player-grid">
      {players.map((player) => (
        <Card className="player-card" key={player.id} bordered={false}>
          <div className="player-card-top">
            <div>
              <div className="mini-label">球员数据查询</div>
              <div className="player-card-name">{player.playerName}</div>
            </div>
            <TeamIdentity teamName={player.teamName} align="right" compact />
          </div>

          <div className="player-stat-row">
            <div>
              <span className="player-stat-label">进球</span>
              <strong>{player.goals}</strong>
            </div>
            <div>
              <span className="player-stat-label">助攻</span>
              <strong>{player.assists}</strong>
            </div>
            <div>
              <span className="player-stat-label">出场</span>
              <strong>{player.appearances}</strong>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default PlayerSpotlightGrid;
