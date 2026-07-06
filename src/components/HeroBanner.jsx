import { Button, Card, Space, Tag } from "antd";
import {
  FireOutlined,
  PlayCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";

function HeroBanner({
  featuredMatch,
  liveGoals,
  onPrimaryAction,
  onSecondaryAction,
}) {
  return (
    <section className="hero-banner">
      <div className="hero-copy">
        <Tag color="red" className="hero-chip">
          LIVE WORLD CUP
        </Tag>
        <h1>比分、进球、赛况，一句自然语言就能查。</h1>
        <p>
          这是一个面向世界杯场景的赛事信息查询智能体首页 Demo。首页先展示
          今日赛程、热门赛事与 Agent 调用过程，后续可直接扩展到查询页与比赛详情页。
        </p>

        <Space size="middle" wrap>
          <Button
            type="primary"
            size="large"
            icon={<RobotOutlined />}
            onClick={onPrimaryAction}
          >
            进入智能查询
          </Button>
          <Button
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={onSecondaryAction}
          >
            查看今日比赛
          </Button>
        </Space>

        <div className="hero-metrics">
          <div>
            <span className="metric-value">3</span>
            <span className="metric-label">今日赛事</span>
          </div>
          <div>
            <span className="metric-value">4</span>
            <span className="metric-label">示例查询</span>
          </div>
          <div>
            <span className="metric-value">1</span>
            <span className="metric-label">进行中焦点战</span>
          </div>
        </div>
      </div>

      <Card className="hero-scoreboard" bordered={false}>
        <div className="scoreboard-top">
          <div>
            <div className="mini-label">焦点赛事</div>
            <div className="scoreboard-stage">{featuredMatch.stage}</div>
          </div>
          <Tag color="red" icon={<FireOutlined />}>
            {featuredMatch.status}
          </Tag>
        </div>

        <div className="scoreline">
          <div className="team-side align-left">
            <span className="team-name">{featuredMatch.homeTeam}</span>
          </div>
          <div className="score-center">
            <span>{featuredMatch.homeScore}</span>
            <span className="score-divider">:</span>
            <span>{featuredMatch.awayScore}</span>
          </div>
          <div className="team-side align-right">
            <span className="team-name">{featuredMatch.awayTeam}</span>
          </div>
        </div>

        <div className="mini-label">关键进球</div>
        <div className="goal-pills">
          {liveGoals.map((event) => (
            <div className="goal-pill" key={event.id}>
              <span>{event.minute}</span>
              <strong>{event.playerName}</strong>
              <em>{event.teamName}</em>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

export default HeroBanner;
