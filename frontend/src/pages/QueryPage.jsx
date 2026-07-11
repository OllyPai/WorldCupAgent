import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, message } from "antd";
import QueryTopBar from "../components/QueryTopBar";
import ChatWorkspace from "../components/ChatWorkspace";
import TraceInspector from "../components/TraceInspector";
import ResultShowcase from "../components/ResultShowcase";
import SiteFooter from "../components/SiteFooter";
import { sendChatMessage } from "../api/chat";
import {
  getQueryCase,
  getQueryCases,
  querySuggestions,
  resolveExampleCaseByQuestion,
} from "../data/queryExamples";

const queryCases = getQueryCases();
const EMPTY_AGENT_RESPONSE = {
  answer: "",
  tool_calls: [],
  error: null,
  result_payload: null,
};

function buildResultSectionFromToolCall(toolCall, index) {
  if (!toolCall || toolCall.status !== "success") {
    return null;
  }

  try {
    const data = JSON.parse(toolCall.summary);

    if (toolCall.tool === "query_schedule") {
      return {
        id: `tool-section-${index}`,
        mode: "schedule",
        title: "查询结果：赛程信息",
        data,
      };
    }

    if (toolCall.tool === "query_player_stats") {
      return {
        id: `tool-section-${index}`,
        mode: "player",
        title: `查询结果：${data.player_name} 数据统计`,
        data,
      };
    }

    if (toolCall.tool === "query_match_detail") {
      return {
        id: `tool-section-${index}`,
        mode: "match_detail",
        title: "查询结果：比赛详情",
        data,
      };
    }
  } catch (error) {
    console.log("Tool summary is not JSON, skipping real-time parsing");
  }

  return null;
}

function formatFailedToolAnswer(toolCall) {
  const summary = toolCall?.summary || "查询失败，请稍后重试。";

  if (toolCall?.tool === "query_schedule") {
    return `赛程查询失败：${summary}`;
  }

  if (toolCall?.tool === "query_player_stats") {
    return `球员数据查询失败：${summary}`;
  }

  if (toolCall?.tool === "query_match_detail") {
    return `比赛详情查询失败：${summary}`;
  }

  return summary;
}

function normalizeAgentResponse(payload = {}) {
  // 先把后端可能返回的几个关键字段统一收口，避免前端到处直接读原始 payload。
  const normalized = {
    answer: payload.answer ?? "",
    tool_calls: Array.isArray(payload.tool_calls) ? payload.tool_calls : [],
    error: payload.error ?? null,
    result_payload: payload.result_payload ?? null,
  };

  // 前端联调时发现：只看 answer 不够，因为后端可能 answer 有内容，
  // 但 tool_calls 里其实已经有失败状态，所以这里额外检查工具调用是否失败。
  const failedToolCall = normalized.tool_calls.find(
    (toolCall) => toolCall.status === "failed"
  );

  // 失败优先：
  // 只要后端 error 存在，或者任意一个工具调用失败，
  // 就不再继续展示成功结果区，避免页面同时出现“失败提示”和“成功结果”。
  if (normalized.error || failedToolCall) {
    normalized.result_payload = null;
    normalized.answer = normalized.error
      ? normalized.answer || normalized.error
      : formatFailedToolAnswer(failedToolCall);
    return normalized;
  }

  // 如果后端没有返回 result_payload，尝试从 tool_calls 中实时解析
  if (!normalized.result_payload && normalized.tool_calls.length > 0) {
    const parsedSections = normalized.tool_calls
      .map((toolCall, index) => buildResultSectionFromToolCall(toolCall, index))
      .filter(Boolean);

    if (parsedSections.length > 1) {
      normalized.result_payload = {
        mode: "multi",
        title: "查询结果：综合信息",
        summary: " ",
        sections: parsedSections,
      };
    } else if (parsedSections.length === 1) {
      normalized.result_payload = parsedSections[0];
    }
  }

  return normalized;
}

function buildAssistantMessage(agentResponse) {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: agentResponse.answer,
    note: agentResponse.result_payload?.summary ?? null,
  };
}

function buildUserMessage(text) {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    content: text,
  };
}

function QueryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCaseId = searchParams.get("case") ?? queryCases[0].id;
  const initialCase = getQueryCase(initialCaseId);

  const [activeCaseId, setActiveCaseId] = useState(initialCase.id);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState(initialCase.request.user_input);
  const [agentResponse, setAgentResponse] = useState(EMPTY_AGENT_RESPONSE);
  const [requestError, setRequestError] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeCase = useMemo(() => getQueryCase(activeCaseId), [activeCaseId]);

  useEffect(() => {
    const caseId = searchParams.get("case") ?? queryCases[0].id;
    const nextCase = getQueryCase(caseId);
    setActiveCaseId(nextCase.id);
    setMessages([]);
    setDraft(nextCase.request.user_input);
    setAgentResponse(EMPTY_AGENT_RESPONSE);
    setRequestError(null);
  }, [searchParams]);

  const handleSelectCase = (caseId) => {
    const nextCase = getQueryCase(caseId);
    if (!nextCase) return;
    setActiveCaseId(nextCase.id);
    setMessages([]);
    setDraft(nextCase.request.user_input);
    setAgentResponse(EMPTY_AGENT_RESPONSE);
    setRequestError(null);
    setSearchParams({ case: nextCase.id });
  };

  const handleSubmit = async () => {
    const question = draft.trim();

    if (!question) {
      message.warning("请先输入一个世界杯相关问题。");
      return;
    }

    const userMessage = buildUserMessage(question);
    // 这里不是简单记录“问了第几次”，而是把当前真实对话历史逐条传给后端。
    // 这样后端 Agent 每次收到请求时，都能看到之前用户问过什么、系统答过什么，
    // 才能正确理解当前这一轮属于第几轮、多轮上下文是什么。
    const historyForBackend = messages.map((item) => ({
      role: item.role,
      content: item.content,
    }));
    const matchedCase = resolveExampleCaseByQuestion(question);

    setRequestError(null);
    setLoading(true);
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setActiveCaseId(matchedCase.id);

    try {
      // 把“当前问题 + 历史消息”一起发给后端，再把返回结果做统一归一化处理。
      const result = normalizeAgentResponse(
        await sendChatMessage(question, historyForBackend)
      );

      setMessages((prev) => [...prev, buildAssistantMessage(result)]);
      setAgentResponse(result);

      if (result.error) {
        setRequestError(result.error);
        message.error(result.error);
      }
    } catch (error) {
      const errorText =
        error instanceof Error ? error.message : "请求后端失败，请稍后重试。";
      setAgentResponse({
        ...EMPTY_AGENT_RESPONSE,
        error: errorText,
      });
      setRequestError(errorText);
      message.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell query-page-shell">
      <div className="page-background" />

      <div className="query-page">
        <QueryTopBar activeLabel={activeCase.label} />

        <section className="query-workspace-layout">
          <div className="query-main-column">
            <ChatWorkspace
              activeCase={activeCase}
              messages={messages}
              suggestions={querySuggestions}
              draft={draft}
              loading={loading}
              onDraftChange={setDraft}
              onSelectCase={handleSelectCase}
              onSubmit={handleSubmit}
            />

            {requestError ? (
              <Alert
                className="query-error-alert"
                message="请求提示"
                description={requestError}
                type="error"
                showIcon
                closable
                onClose={() => setRequestError(null)}
              />
            ) : null}

            <ResultShowcase
              result={agentResponse.result_payload}
              fallbackAnswer={agentResponse.answer}
            />
          </div>

          <div className="query-side-column">
            <TraceInspector
              toolCalls={agentResponse.tool_calls}
              error={agentResponse.error}
            />
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

export default QueryPage;
