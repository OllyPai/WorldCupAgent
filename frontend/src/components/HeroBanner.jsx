import { Button, Card, Space, Tag } from "antd";
import {
  FireOutlined,
  PlayCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import TeamIdentity from "./TeamIdentity";
import footballWorldcupHero from "../assets/football-worldcup-hero.svg";
import trophyMark from "../assets/trophy-mark.svg";

function HeroBanner({
  featuredMatch,
  liveGoals,
  onPrimaryAction,
  onSecondaryAction,
}) {
  return (
    <section className="hero-banner" id="home">
      <div className="hero-copy">
        <div className="hero-atmosphere-glow hero-atmosphere-left" />
        <div className="hero-atmosphere-glow hero-atmosphere-right" />
        <Tag color="red" className="hero-chip">
          世界杯进行中
        </Tag>
        <h1>世界杯赛事， 一站掌握。</h1>
        <p>
          实时查询比赛赛程、比分、球员数据与赛事详情，
          让每一场精彩对决尽在掌握。
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
            <span className="metric-value">赛程查询</span>
            <span className="metric-label">查看球队、日期与阶段赛程</span>
          </div>
          <div>
            <span className="metric-value">球员数据</span>
            <span className="metric-label">聚焦进球、助攻与出场信息</span>
          </div>
          <div>
            <span className="metric-value">比赛详情</span>
            <span className="metric-label">查看比分、阶段与关键记录</span>
          </div>
        </div>

        <div className="hero-duel-strip">
          <div className="mini-label">今日焦点对阵</div>
          <div className="hero-duel-row">
            <TeamIdentity teamName={featuredMatch.homeTeam} compact />
            <span className="hero-duel-badge">VS</span>
            <TeamIdentity teamName={featuredMatch.awayTeam} align="right" compact />
          </div>
        </div>
      </div>

      <Card className="hero-scoreboard" bordered={false}>
        <div className="hero-illustration-card">
          <img
            className="hero-illustration-main"
            src={footballWorldcupHero}
            alt="世界杯足球赛场插图"
          />
          <img
            className="hero-illustration-trophy"
            src={trophyMark}
            alt="世界杯奖杯插图"
          />
        </div>
        <div className="scoreboard-corner-badge">FINAL STAGE</div>
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
            <TeamIdentity teamName={featuredMatch.homeTeam} />
          </div>
          <div className="score-center">
            <span>{featuredMatch.homeScore}</span>
            <span className="score-divider">:</span>
            <span>{featuredMatch.awayScore}</span>
          </div>
          <div className="team-side align-right">
            <TeamIdentity teamName={featuredMatch.awayTeam} align="right" />
          </div>
        </div>

        <div className="scoreboard-match-meta">
          <span>开球时间 {featuredMatch.matchTime}</span>
          <span>实时比分追踪</span>
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
