import { Card, Empty, Steps, Tag } from "antd";
import { CheckCircleOutlined, ToolOutlined } from "@ant-design/icons";

function TraceInspector({ toolCalls = [], error = null }) {
  const hasInvalidQuery = toolCalls.some((toolCall) => toolCall.is_invalid_query === true);
  const hasFailedTool = toolCalls.some((toolCall) => toolCall.status === "failed" && !toolCall.is_invalid_query);
  const overallFailed = Boolean(error || hasFailedTool);

  const stepItems = toolCalls.map((toolCall, index) => ({
    title: `工具调用 ${index + 1}`,
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
        <span className="section-kicker">工具调用过程</span>
        <h3>查看智能体调用了哪些工具</h3>
        <p>这里展示工具名、输入参数、执行状态和结果摘要。</p>
      </div>

      {toolCalls.length === 0 && !error ? (
        <Empty description="发起查询后，这里将展示工具调用过程" />
      ) : null}

      <div className="trace-summary-grid">
        <div className="trace-summary-item">
          <span>调用次数</span>
          <Tag color="green">{toolCalls.length}</Tag>
        </div>
        <div className="trace-summary-item">
          <span>整体状态</span>
          <Tag color={hasInvalidQuery ? "orange" : overallFailed ? "red" : "blue"}>
            {toolCalls.length === 0 && !error ? "待查询" : hasInvalidQuery ? "无效" : overallFailed ? "失败" : "成功"}
          </Tag>
        </div>
      </div>

      {toolCalls.length > 0 ? (
        <>
          {toolCalls.map((toolCall) => (
            <div className="trace-code-block" key={`${toolCall.tool}-${JSON.stringify(toolCall.input)}`}>
              <div className="detail-label">
                {toolCall.tool} · {toolCall.is_invalid_query ? "无效" : toolCall.status === "failed" ? "失败" : "成功"}
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
        </>
      ) : null}
    </Card>
  );
}

export default TraceInspector;
