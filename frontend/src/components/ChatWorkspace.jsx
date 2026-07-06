import { useMemo } from "react";
import { Avatar, Button, Card, Input, Space, Tag } from "antd";
import {
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

function ChatWorkspace({
  activeCase,
  messages,
  suggestions,
  draft,
  loading,
  onDraftChange,
  onSelectCase,
  onSubmit,
}) {
  const helperText = useMemo(
    () => activeCase?.placeholder ?? "请输入世界杯相关问题",
    [activeCase]
  );

  return (
    <Card className="query-chat-card" bordered={false}>
      <div className="section-headline">
        <span className="section-kicker">Dialogue Interface</span>
        <h2>让用户像聊天一样问，但返回的是可验证的赛事结果</h2>
        <p>这里是你的核心职责页面，后续接后端后会直接承接真实问答流程。</p>
      </div>

      <div className="query-suggestion-row">
        {suggestions.map((item) => (
          <Button
            key={item.id}
            className={`query-chip ${
              item.id === activeCase.id ? "is-selected" : ""
            }`}
            icon={<ThunderboltOutlined />}
            onClick={() => onSelectCase(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="chat-message-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message-row ${
              message.role === "user" ? "from-user" : "from-assistant"
            }`}
          >
            <Avatar
              className={`chat-avatar ${
                message.role === "user" ? "user-avatar" : "assistant-avatar"
              }`}
              icon={message.role === "user" ? <MessageOutlined /> : <RobotOutlined />}
            />
            <div className="chat-bubble-wrap">
              <div className="chat-bubble">
                <div className="chat-role">
                  {message.role === "user" ? "用户问题" : "系统回答"}
                </div>
                <p>{message.content}</p>
              </div>
              {message.note ? <div className="chat-note">{message.note}</div> : null}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="chat-message-row from-assistant">
            <Avatar className="chat-avatar assistant-avatar" icon={<RobotOutlined />} />
            <div className="chat-bubble loading-bubble">
              <div className="chat-role">系统回答</div>
              <p>正在调用工具并整理结果，请稍等...</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="composer-wrap">
        <div className="composer-hint">
          <Tag color="blue">Mock Query</Tag>
          <span>{helperText}</span>
        </div>
        <TextArea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={helperText}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
        <Space className="composer-actions">
          <Button onClick={() => onDraftChange(activeCase.request.user_input)}>填充当前示例</Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={onSubmit}
          >
            发送问题
          </Button>
        </Space>
      </div>
    </Card>
  );
}

export default ChatWorkspace;
