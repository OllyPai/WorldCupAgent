import { Button, Card, Space, Tag } from "antd";
import { PlayCircleOutlined, RobotOutlined } from "@ant-design/icons";
import heroPlayersImage from "../assets/hero-players.jpg";
import worldCupEmblem from "../assets/world-cup-2026-emblem.svg";

function HeroBanner({
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
        <div className="hero-title-row">
          <h1>世界杯赛事<br></br> 一站掌握</h1>
          <img
            className="hero-title-emblem"
            src={worldCupEmblem}
            alt="2026 世界杯会徽"
          />
        </div>
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
            查看近日比赛
          </Button>
        </Space>

      </div>

      <Card className="hero-scoreboard" bordered={false}>
        <div className="hero-illustration-card">
          <img
            className="hero-illustration-main"
            src={heroPlayersImage}
            alt="世界杯球员群像插图"
          />
        </div>
      </Card>
    </section>
  );
}

export default HeroBanner;
