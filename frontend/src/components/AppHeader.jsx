import { Button, Space, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ThemeToggleButton from "./ThemeToggleButton";
import worldCupEmblem from "../assets/world-cup-2026-emblem.svg";

function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark">
          <img src={worldCupEmblem} alt="2026 世界杯会徽" className="brand-mark-image" />
        </div>
        <div>
          <div className="brand-title">世界杯赛事中心</div>
        </div>
      </div>

      <nav className="header-nav">
        <a href="#home">首页</a>
        <a href="#schedule">赛程查询</a>
        <a href="#player">球员数据查询</a>
        <a href="#detail">比赛详情查询</a>
      </nav>

      <Space size="middle">
        <ThemeToggleButton />
        <Tag color="cyan" className="header-tag">
          WORLD CUP 2026
        </Tag>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={() => navigate("/query")}
        >
          立即查询
        </Button>
      </Space>
    </header>
  );
}

export default AppHeader;
