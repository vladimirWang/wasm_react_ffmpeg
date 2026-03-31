import { useMemo, useState } from "react";
import { Button, Card, Input, Select, Space, Typography } from "antd";
import { aiChatStream } from "../api/openai";

const { TextArea } = Input;

type PanelKey = "deepseek";

export default function OpenAIChatDemo() {
  const [prompt, setPrompt] = useState("用一句话解释什么是数据库索引？");
  const [temperature, setTemperature] = useState<number>(0);
  const [maxTokens, setMaxTokens] = useState<number>(128);

  const [modelDeepSeek, setModelDeepSeek] = useState("deepseek-chat");

  const [loading, setLoading] = useState(false);

  const [text, setText] = useState<Record<PanelKey, string>>({
    deepseek: "",
  });
  const [meta, setMeta] = useState<Record<PanelKey, string | null>>({
    deepseek: null,
  });
  const [err, setErr] = useState<Record<PanelKey, string | null>>({
    deepseek: null,
  });

  const canSend = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);

  const clearAll = () => {
    setPrompt("");
    setText({ deepseek: "" });
    setMeta({ deepseek: null });
    setErr({ deepseek: null });
  };

  const runPanel = async (
    key: PanelKey,
    path: string,
    model: string,
  ) => {
    const body = { prompt, model, temperature, maxTokens };
    try {
      await aiChatStream(path, body, (evt) => {
        if (evt.type === "meta") {
          setMeta((m) => ({ ...m, [key]: evt.model }));
          return;
        }
        if (evt.type === "delta") {
          setText((t) => ({ ...t, [key]: t[key] + evt.delta }));
          return;
        }
        if (evt.type === "error") {
          setErr((e) => ({ ...e, [key]: evt.message }));
        }
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "请求失败";
      setErr((x) => ({ ...x, [key]: msg }));
    }
  };

  const onSendAll = async () => {
    setLoading(true);
    setText({ deepseek: "" });
    setMeta({ deepseek: null });
    setErr({ deepseek: null });

    await runPanel("deepseek", "/openai/deepseek/chat/stream", modelDeepSeek);
    setLoading(false);
  };

  const panel = (
    title: string,
    key: PanelKey,
    modelValue: string,
    onModelChange: (v: string) => void,
    modelOptions: { label: string; value: string }[],
  ) => (
    <Card key={key} title={title} size="small" style={{ height: "100%" }}>
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>模型</div>
          <Select
            value={modelValue}
            style={{ width: "100%" }}
            options={modelOptions}
            onChange={onModelChange}
            showSearch
          />
        </div>
        {meta[key] ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            实际: {meta[key]}
          </Typography.Text>
        ) : null}
        {err[key] ? (
          <Typography.Text type="danger">{err[key]}</Typography.Text>
        ) : (
          <Typography.Paragraph
            style={{ whiteSpace: "pre-wrap", marginBottom: 0, minHeight: 120 }}
          >
            {text[key] || "(等待流式输出…)"}
          </Typography.Paragraph>
        )}
      </Space>
    </Card>
  );

  return (
    <div style={{ padding: 16, maxWidth: 1400, margin: "0 auto" }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        DeepSeek SSE Demo
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
        通过后端转发 DeepSeek（OpenAI 兼容）接口，使用 SSE 进行流式输出。
      </Typography.Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Space wrap>
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>temperature</div>
              <Select
                value={temperature}
                style={{ width: 120 }}
                options={[
                  { label: "0.0", value: 0.0 },
                  { label: "0.7", value: 0.7 },
                  { label: "1.0", value: 1.0 },
                ]}
                onChange={setTemperature}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>maxTokens</div>
              <Select
                value={maxTokens}
                style={{ width: 120 }}
                options={[
                  { label: "128", value: 128 },
                  { label: "512", value: 512 },
                  { label: "1024", value: 1024 },
                ]}
                onChange={setMaxTokens}
              />
            </div>
          </Space>

          <div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Prompt（共用）</div>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder="输入 prompt…"
            />
          </div>

          <Space>
            <Button type="primary" onClick={onSendAll} loading={loading} disabled={!canSend}>
              发送
            </Button>
            <Button onClick={clearAll} disabled={loading}>
              清空
            </Button>
          </Space>
        </Space>
      </Card>

      {panel(
        "DeepSeek",
        "deepseek",
        modelDeepSeek,
        setModelDeepSeek,
        [
          { label: "deepseek-chat", value: "deepseek-chat" },
          { label: "deepseek-reasoner", value: "deepseek-reasoner" },
        ],
      )}
    </div>
  );
}
