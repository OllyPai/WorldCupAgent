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
  const normalized = {
    answer: payload.answer ?? "",
    tool_calls: Array.isArray(payload.tool_calls) ? payload.tool_calls : [],
    error: payload.error ?? null,
    result_payload: payload.result_payload ?? null,
  };

  const failedToolCall = normalized.tool_calls.find(
    (toolCall) => toolCall.status === "failed"
  );

  if (normalized.error || failedToolCall) {
    normalized.result_payload = null;
    normalized.answer = normalized.error
      ? normalized.answer || normalized.error
      : formatFailedToolAnswer(failedToolCall);
    return normalized;
  }

  // 如果后端没有返回 result_payload，尝试从 tool_calls 中实时解析
  if (!normalized.result_payload && normalized.tool_calls.length > 0) {
    const lastToolCall = normalized.tool_calls[normalized.tool_calls.length - 1];
    if (lastToolCall.status === "success") {
      try {
        const data = JSON.parse(lastToolCall.summary);
        if (lastToolCall.tool === "query_schedule") {
          normalized.result_payload = {
            mode: "schedule",
            title: "查询结果：赛程信息",
            data: data,
          };
        } else if (lastToolCall.tool === "query_player_stats") {
          normalized.result_payload = {
            mode: "player",
            title: `查询结果：${data.player_name} 数据统计`,
            data: data,
          };
        } else if (lastToolCall.tool === "query_match_detail") {
          normalized.result_payload = {
            mode: "match_detail",
            title: "查询结果：比赛详情",
            data: data,
          };
        }
      } catch (e) {
        // 如果 summary 不是 JSON，则保持原样
        console.log("Tool summary is not JSON, skipping real-time parsing");
      }
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
