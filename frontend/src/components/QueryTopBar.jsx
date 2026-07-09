import { Button, Space, Tag } from "antd";
import { ArrowLeftOutlined, ApiOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ThemeToggleButton from "./ThemeToggleButton";

function QueryTopBar({ activeLabel }) {
  const navigate = useNavigate();

  return (
    <header className="query-topbar">
      <div>
        <div className="query-topbar-title">智能查询工作台</div>
        {/* <div className="query-topbar-subtitle">
          赛程查询 + 球员数据查询 + 比赛详情查询
        </div> */}
      </div>

      <Space wrap>
        <ThemeToggleButton />
        <Tag color="cyan">当前查询 · {activeLabel}</Tag>
        <Tag color="green" icon={<ApiOutlined />}>
          一键查询
        </Tag>
        <Button
          type="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
        >
          返回首页
        </Button>
      </Space>
    </header>
  );
}

export default QueryTopBar;
