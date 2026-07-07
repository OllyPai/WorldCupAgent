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
        <div className="query-topbar-subtitle">
          对话界面 + 工具调用过程 + 结构化结果展示
        </div>
      </div>

      <Space wrap>
        <Tag color="cyan">当前案例 · {activeLabel}</Tag>
        <Tag color="green" icon={<ApiOutlined />}>
          过程可见
        </Tag>
        <ThemeToggleButton />
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
