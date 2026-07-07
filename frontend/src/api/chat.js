const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function toBackendHistory(history = []) {
  return history.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export async function sendChatMessage(userInput, history = []) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_input: userInput,
      history: toBackendHistory(history),
    }),
  });

  if (!response.ok) {
    throw new Error(`后端请求失败：HTTP ${response.status}`);
  }

  return response.json();
}

export { API_BASE_URL };
