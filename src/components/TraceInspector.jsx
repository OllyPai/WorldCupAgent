import { Card, Steps, Tag, Timeline } from "antd";
import {
  CheckCircleOutlined,
  ToolOutlined,
} from "@ant-design/icons";

function TraceInspector({ toolCalls = [], error = null }) {
  const stepItems = toolCalls.map((toolCall, index) => ({
    title: `Tool Call ${index + 1}`,
    description: `${toolCall.tool} · ${toolCall.summary}`,
    icon:
      index === 0 && toolCalls.length === 1 ? (
        <CheckCircleOutlined />
      ) : (
        <ToolOutlined />
      ),
  }));

  return (
    <Card className="trace-inspector-card" bordered={false}>
      <div className="section-headline trace-headline">
        <span className="section-kicker">Tool Calling Trace</span>
        <h3>重点展示 Agent 的决策过程</h3>
        <p>这部分是你前端的加分核心，老师会一眼看出你们不是普通问答系统。</p>
      </div>

      <div className="trace-summary-grid">
        <div className="trace-summary-item">
          <span>调用次数</span>
          <Tag color="green">{toolCalls.length}</Tag>
        </div>
        <div className="trace-summary-item">
          <span>整体状态</span>
          <Tag color={error ? "red" : "blue"}>{error ? "error" : "success"}</Tag>
        </div>
      </div>

      {toolCalls.map((toolCall) => (
        <div className="trace-code-block" key={`${toolCall.tool}-${JSON.stringify(toolCall.input)}`}>
          <div className="detail-label">
            {toolCall.tool} · {toolCall.status}
          </div>
          <code>{JSON.stringify(toolCall.input, null, 2)}</code>
          <p>{toolCall.summary}</p>
        </div>
      ))}

      <Steps
        className="trace-steps"
        direction="vertical"
        size="small"
        current={stepItems.length > 0 ? stepItems.length - 1 : 0}
        items={stepItems}
      />

      <Timeline
        className="trace-timeline-panel"
        items={[
          { color: "blue", children: "接收自然语言问题" },
          { color: "green", children: "将 history 与 user_input 发送给 Agent" },
          { color: "blue", children: "调用世界杯工具集" },
          { color: "green", children: "整合工具结果并生成回答" },
        ]}
      />
    </Card>
  );
}

export default TraceInspector;
