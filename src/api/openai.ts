export type OpenAIChatStreamEvent =
  | { type: "meta"; model: string }
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

function parseSSE(buffer: string): { events: OpenAIChatStreamEvent[]; rest: string } {
  const events: OpenAIChatStreamEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n").map((l) => l.trimEnd());
    if (lines.length === 0) continue;

    let eventType: string | null = null;
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) eventType = line.slice("event:".length).trim();
      if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).trim());
    }

    const dataStr = dataLines.join("\n");
    if (!eventType) {
      // 默认 data 行：我们用 {delta} 传输
      try {
        const obj = JSON.parse(dataStr || "{}");
        if (typeof obj?.delta === "string") events.push({ type: "delta", delta: obj.delta });
      } catch {
        /* ignore */
      }
      continue;
    }

    if (eventType === "meta") {
      try {
        const obj = JSON.parse(dataStr || "{}");
        if (obj?.model) events.push({ type: "meta", model: String(obj.model) });
      } catch {
        /* ignore */
      }
      continue;
    }

    if (eventType === "done") {
      events.push({ type: "done" });
      continue;
    }

    if (eventType === "error") {
      try {
        const obj = JSON.parse(dataStr || "{}");
        events.push({ type: "error", message: String(obj?.message || "请求失败") });
      } catch {
        events.push({ type: "error", message: "请求失败" });
      }
    }
  }

  return { events, rest };
}

/** 通用 SSE：path 如 `/openai/chat/stream`、`/openai/azure/chat/stream` 等 */
export async function aiChatStream(
  path: string,
  body: { prompt: string; model?: string; temperature?: number; maxTokens?: number },
  onEvent: (evt: OpenAIChatStreamEvent) => void,
): Promise<void> {
  const token = localStorage.getItem("access_token") || "";
  const resp = await fetch(`/nodejs_api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `请求失败(${resp.status})`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const { events, rest } = parseSSE(buf);
    buf = rest;
    for (const e of events) onEvent(e);
  }
}
