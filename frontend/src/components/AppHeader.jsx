import { Button, Space, Tag } from "antd";
import { SearchOutlined, TrophyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ThemeToggleButton from "./ThemeToggleButton";

function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark">WC</div>
        <div>
          <div className="brand-title">世界杯赛事智能体</div>
          <div className="brand-subtitle">
            赛事查询 · 比分追踪 · 进球脉络
          </div>
        </div>
      </div>

      <nav className="header-nav">
        <a href="#today">演示赛程</a>
        <a href="#featured">示例赛事</a>
        <a href="#query">快捷查询</a>
        <a href="#agent">智能体流程</a>
      </nav>

      <Space size="middle">
        <Tag color="cyan" className="header-tag">
          演示数据
        </Tag>
        <ThemeToggleButton />
        <Button
          type="default"
          icon={<TrophyOutlined />}
          onClick={() => navigate("/query?case=query-04")}
        >
          查看示例比赛
        </Button>
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
