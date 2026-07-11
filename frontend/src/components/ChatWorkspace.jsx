import { useMemo } from "react";
import { Avatar, Button, Card, Input, Space, Tag } from "antd";
import {
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

function cleanAssistantText(content = "") {
  return content
    .replaceAll("（本地课程演示数据库）", "")
    .replaceAll("(本地课程演示数据库)", "")
    .replace(/\s+：/g, "：")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^[-•]?\s*比赛ID[:：]/.test(line))
    .join("\n")
    .trim();
}

function formatAssistantContent(content = "") {
  const cleaned = cleanAssistantText(content);

  if (!cleaned) {
    return [];
  }

  const sectionMarkers = [
    "赛程查询结果",
    "球员数据查询结果",
    "比赛详情查询结果",
  ];

  const markerPattern = new RegExp(`(${sectionMarkers.join("|")})`, "g");
  const markerMatches = [...cleaned.matchAll(markerPattern)];

  if (markerMatches.length > 1) {
    const blocks = [];

    markerMatches.forEach((match, index) => {
      const start = match.index;
      const end =
        index + 1 < markerMatches.length
          ? markerMatches[index + 1].index
          : cleaned.length;
      const segment = cleaned.slice(start, end).trim();

      if (!segment) {
        return;
      }

      const splitIndex = segment.indexOf("：");

      if (splitIndex === -1) {
        blocks.push({ type: "paragraph", content: segment });
        return;
      }

      const title = segment.slice(0, splitIndex + 1).trim();
      const body = segment.slice(splitIndex + 1).trim();

      blocks.push({ type: "paragraph", content: title });

      if (body) {
        blocks.push(...formatAssistantContent(body));
      }
    });

    return blocks;
  }

  const matchListPattern = /\s-\s\d{4}-\d{2}-\d{2}/;

  if (matchListPattern.test(cleaned)) {
    const [titlePart, ...items] = cleaned.split(/\s-\s(?=\d{4}-\d{2}-\d{2})/);

    return [
      {
        type: "paragraph",
        content: titlePart.trim(),
      },
      {
        type: "list",
        items: items.map((item) => item.trim()).filter(Boolean),
      },
    ].filter((block) =>
      block.type === "paragraph"
        ? block.content
        : Array.isArray(block.items) && block.items.length > 0
    );
  }

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (
    lines.length === 1 &&
    /-\s*球员：|-\s*球队：|-\s*进球：|-\s*助攻：|-\s*出场次数：/.test(cleaned)
  ) {
    const [titlePart, ...items] = cleaned.split(/\s*-\s*(?=球员：|球队：|进球：|助攻：|出场次数：)/);

    return [
      titlePart.trim()
        ? { type: "paragraph", content: titlePart.trim() }
        : null,
      items.length
        ? {
            type: "list",
            items: items.map((item) => item.trim()).filter(Boolean),
          }
        : null,
    ].filter(Boolean);
  }

  if (lines.some((line) => line.startsWith("- "))) {
    const paragraphLines = [];
    const listItems = [];

    lines.forEach((line) => {
      if (line.startsWith("- ")) {
        listItems.push(line.replace(/^- /, "").trim());
      } else {
        paragraphLines.push(line);
      }
    });

    return [
      paragraphLines.length
        ? { type: "paragraph", content: paragraphLines.join("\n") }
        : null,
      listItems.length ? { type: "list", items: listItems } : null,
    ].filter(Boolean);
  }

  return [{ type: "paragraph", content: cleaned }];
}

function AssistantMessageBody({ content }) {
  const blocks = formatAssistantContent(content);

  if (!blocks.length) {
    return <p>{content}</p>;
  }

  return (
    <div className="chat-answer-richtext">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={`list-${index}`} className="chat-answer-list">
              {block.items.map((item, itemIndex) => (
                <li key={`item-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="chat-answer-paragraph">
            {block.content}
          </p>
        );
      })}
    </div>
  );
}

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
        <span className="section-kicker">在这里对话</span>
        <h2>问你想问，获取赛程、球员数据或比赛详情</h2>
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
                {/* <div className="chat-role">
                  {message.role === "user" ? "用户问题" : "系统回答"}
                </div> */}
                {message.role === "assistant" ? (
                  <AssistantMessageBody content={message.content} />
                ) : (
                  <p>{message.content}</p>
                )}
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
          <Tag color="blue">示例问句</Tag>
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
