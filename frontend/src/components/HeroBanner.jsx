import { Button, Space, Tag } from "antd";
import { PlayCircleOutlined, RobotOutlined } from "@ant-design/icons";
import heroPlayersImage from "../assets/hero-players.jpg";

function HeroBanner({
  onPrimaryAction,
  onSecondaryAction,
}) {
  return (
    <section className="hero-banner" id="home">
      <div className="hero-copy">
        <div className="hero-atmosphere-glow hero-atmosphere-left" />
        <div className="hero-atmosphere-glow hero-atmosphere-right" />
        {/* <Tag color="red" className="hero-chip">
          世界杯进行中
        </Tag> */}
        <div className="hero-title-row">
          <h1>世界杯<br />智能赛事中心</h1>
        </div>
        <p>
          让每一场精彩对决尽在掌握
          <br />
          AI驱动的赛程查询、球员分析与赛事洞察
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
        <div className="hero-illustration-wrap">
          <img
            className="hero-illustration-main"
            src={heroPlayersImage}
            alt="世界杯球员群像插图"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
