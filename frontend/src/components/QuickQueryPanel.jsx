import { Button, Card, Space, Tag } from "antd";
import {
  ArrowRightOutlined,
  MessageOutlined,
  SearchOutlined,
} from "@ant-design/icons";

function QuickQueryPanel({
  queries,
  selectedQueryId,
  onSelectQuery,
  trace,
  onOpenQuery,
}) {
  return (
    <div className="query-panel-grid">
      <Card className="query-choice-card" bordered={false}>
        <div className="section-headline">
          <span className="section-kicker">Quick Query</span>
          <h3>让首页先具备“会问会答”的感觉</h3>
        </div>

        <Space direction="vertical" size="middle" className="query-buttons">
          {queries.map((query) => (
            <Button
              key={query.id}
              className={`query-button ${
                selectedQueryId === query.id ? "is-active" : ""
              }`}
              icon={<SearchOutlined />}
              onClick={() => onSelectQuery(query.id)}
            >
              {query.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Card className="query-answer-card" bordered={false}>
        <div className="answer-topline">
          <Tag color="cyan">当前示例问题</Tag>
          <span className="mini-label">Natural Language Input</span>
        </div>

        <div className="answer-question">
          <MessageOutlined /> {trace.userQuestion}
        </div>

        <div className="answer-box">
          <div className="answer-label">系统回答</div>
          <p>{trace.finalAnswer}</p>
          <Button
            type="default"
            icon={<ArrowRightOutlined />}
            className="answer-action"
            onClick={onOpenQuery}
          >
            在查询页继续追问
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default QuickQueryPanel;
