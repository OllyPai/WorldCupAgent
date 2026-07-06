import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { message } from "antd";
import QueryTopBar from "../components/QueryTopBar";
import ChatWorkspace from "../components/ChatWorkspace";
import TraceInspector from "../components/TraceInspector";
import ResultShowcase from "../components/ResultShowcase";
import SiteFooter from "../components/SiteFooter";
import {
  buildConversationState,
  buildMockAgentPayload,
  getQueryCase,
  getQueryCases,
  querySuggestions,
  resolveMockCaseByQuestion,
} from "../data/queryMock";

const queryCases = getQueryCases();

function buildAssistantMessage(agentResponse) {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: agentResponse.answer,
    note: agentResponse.result_payload?.summary ?? agentResponse.answer,
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
  const initialState = buildConversationState(initialCase);

  const [activeCaseId, setActiveCaseId] = useState(initialCase.id);
  const [messages, setMessages] = useState(initialState.messages);
  const [history, setHistory] = useState(initialState.history);
  const [draft, setDraft] = useState(initialState.draft);
  const [agentResponse, setAgentResponse] = useState(initialState.response);
  const [loading, setLoading] = useState(false);

  const activeCase = useMemo(() => getQueryCase(activeCaseId), [activeCaseId]);

  useEffect(() => {
    const caseId = searchParams.get("case");
    if (caseId && caseId !== activeCaseId) {
      const nextCase = getQueryCase(caseId);
      const nextState = buildConversationState(nextCase);
      setActiveCaseId(nextCase.id);
      setMessages(nextState.messages);
      setHistory(nextState.history);
      setDraft(nextState.draft);
      setAgentResponse(nextState.response);
    }
  }, [activeCaseId, searchParams]);

  const handleSelectCase = (caseId) => {
    const nextCase = getQueryCase(caseId);
    if (!nextCase) return;
    const nextState = buildConversationState(nextCase);
    setActiveCaseId(caseId);
    setMessages(nextState.messages);
    setHistory(nextState.history);
    setDraft(nextState.draft);
    setAgentResponse(nextState.response);
    setSearchParams({ case: caseId });
  };

  const handleSubmit = () => {
    const question = draft.trim();

    if (!question) {
      message.warning("请先输入一个世界杯相关问题。");
      return;
    }

    const matchedCase = resolveMockCaseByQuestion(question);
    const userMessage = buildUserMessage(question);

    setLoading(true);

    window.setTimeout(() => {
      const mockPayload = buildMockAgentPayload(question, history, matchedCase);
      const nextHistory = [
        ...history,
        { role: "user", content: question },
        { role: "assistant", content: mockPayload.response.answer },
      ];
      setActiveCaseId(matchedCase.id);
      setMessages((prev) => [
        ...prev,
        userMessage,
        buildAssistantMessage(mockPayload.response),
      ]);
      setHistory(nextHistory);
      setAgentResponse(mockPayload.response);
      setSearchParams({ case: matchedCase.id });
      setLoading(false);
    }, 420);
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

            <ResultShowcase result={agentResponse.result_payload} />
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
