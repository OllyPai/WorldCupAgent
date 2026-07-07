import { Card, Col, Row, Tag, Timeline } from "antd";
import {
  CheckCircleOutlined,
  DatabaseOutlined,
  RobotOutlined,
  ToolOutlined,
} from "@ant-design/icons";

const stepIcons = [
  <RobotOutlined key="robot" />,
  <ToolOutlined key="tool" />,
  <DatabaseOutlined key="db" />,
  <CheckCircleOutlined key="done" />,
];

function AgentFlowPanel({ trace }) {
  return (
    <div className="agent-panel-grid">
      <Card className="agent-step-card" bordered={false}>
        <div className="section-headline">
          <span className="section-kicker">智能体轨迹</span>
          <h3>不是普通问答，而是“理解 → 调用 → 观察 → 回答”</h3>
        </div>

        <Row gutter={[16, 16]}>
          {trace.steps.map((step, index) => (
            <Col xs={24} sm={12} key={step}>
              <div className="trace-step-box">
                <div className="trace-icon">{stepIcons[index]}</div>
                <div>
                  <strong>步骤 {index + 1}</strong>
                  <p>{step}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card className="agent-detail-card" bordered={false}>
        <div className="detail-row">
          <span className="detail-label">识别意图</span>
          <Tag color="green">{trace.intent}</Tag>
        </div>

        <div className="detail-row">
          <span className="detail-label">调用工具</span>
          <Tag color="blue">{trace.toolName}</Tag>
        </div>

        <div className="detail-block">
          <div className="detail-label">工具参数</div>
          <code>{trace.toolParams}</code>
        </div>

        <div className="detail-block">
          <div className="detail-label">结果摘要</div>
          <p>{trace.toolResultSummary}</p>
        </div>

        <Timeline
          className="trace-timeline"
          items={[
            { color: "blue", children: "用户发起问题" },
            { color: "green", children: "智能体判断任务类型" },
            { color: "blue", children: "调用赛事信息工具" },
            { color: "green", children: "整合结果并生成回答" },
          ]}
        />
      </Card>
    </div>
  );
}

export default AgentFlowPanel;
