from fastapi.testclient import TestClient

import backend.app as api_module


def test_health_check():
    client = TestClient(api_module.app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_endpoint_returns_frontend_contract(monkeypatch):
    captured = {}

    def fake_chat_with_agent(user_input, history):
        captured["user_input"] = user_input
        captured["history"] = history
        return {
            "answer": "球员数据查询结果（本地课程演示数据库）：\n- 球员：梅西",
            "tool_calls": [
                {
                    "tool": "query_player_stats",
                    "input": {"player_name": "梅西"},
                    "status": "success",
                    "summary": '{"player_name": "梅西"}',
                }
            ],
            "error": None,
        }

    monkeypatch.setattr(api_module, "chat_with_agent", fake_chat_with_agent)
    client = TestClient(api_module.app)

    response = client.post(
        "/api/chat",
        json={
            "user_input": "请查询梅西的世界杯进球数据",
            "history": [{"role": "user", "content": "你好"}],
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "answer": "球员数据查询结果（本地课程演示数据库）：\n- 球员：梅西",
        "tool_calls": [
            {
                "tool": "query_player_stats",
                "input": {"player_name": "梅西"},
                "status": "success",
                "summary": '{"player_name": "梅西"}',
            }
        ],
        "error": None,
        "result_payload": None,
    }
    assert captured == {
        "user_input": "请查询梅西的世界杯进球数据",
        "history": [{"role": "user", "content": "你好"}],
    }


def test_chat_endpoint_maps_internal_error_status_to_failed(monkeypatch):
    def fake_chat_with_agent(user_input, history):
        return {
            "answer": "query_player_stats 调用失败：未查询到球员",
            "tool_calls": [
                {
                    "tool": "query_player_stats",
                    "input": {"player_name": "不存在球员"},
                    "status": "error",
                    "summary": "未查询到球员",
                }
            ],
            "error": None,
        }

    monkeypatch.setattr(api_module, "chat_with_agent", fake_chat_with_agent)
    client = TestClient(api_module.app)

    response = client.post(
        "/api/chat",
        json={"user_input": "请查询不存在球员", "history": []},
    )

    assert response.status_code == 200
    assert response.json()["tool_calls"][0]["status"] == "failed"
