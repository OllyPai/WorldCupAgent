from typing import Any, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent import chat_with_agent


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    user_input: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)


class ToolCall(BaseModel):
    tool: str
    input: dict[str, Any]
    status: Literal["success", "failed"]
    summary: str


class ChatResponse(BaseModel):
    answer: str
    tool_calls: list[ToolCall]
    error: str | None = None
    result_payload: dict[str, Any] | None = None


app = FastAPI(title="WorldCupAgent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _frontend_status(status: str) -> Literal["success", "failed"]:
    return "success" if status == "success" else "failed"


def _to_frontend_response(result: dict[str, Any]) -> ChatResponse:
    tool_calls = [
        ToolCall(
            tool=call["tool"],
            input=call["input"],
            status=_frontend_status(call["status"]),
            summary=call["summary"],
        )
        for call in result.get("tool_calls", [])
    ]

    return ChatResponse(
        answer=result.get("answer", ""),
        tool_calls=tool_calls,
        error=result.get("error"),
        result_payload=None,
    )


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    history = [message.model_dump() for message in request.history]
    result = chat_with_agent(request.user_input, history)
    return _to_frontend_response(result)
