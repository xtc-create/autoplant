"use client";

import { FormEvent, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function PlantChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Më pyet për bimën, ujitjen, lagështinë, temperaturën ose leximin më të fundit të sensorëve.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/plant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }

      setMessages([...nextMessages, { role: "assistant", content: json.reply }]);
    } catch (err) {
      setError((err as Error).message);
      setMessages(nextMessages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section className="plant-chat panel">
      <style>{`
        .plant-chat {
          margin-top: 12px;
          overflow: hidden;
          min-width: 0;
        }

        .chat-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding: 14px 18px;
        }

        .chat-head h2 {
          margin: 4px 0 0;
          font-size: 16px;
        }

        .chat-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: min(360px, 48vh);
          overflow-y: auto;
          padding: 16px 18px;
        }

        .chat-message {
          max-width: min(84%, 760px);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .chat-message.user {
          align-self: flex-end;
          background: rgba(34,197,94,0.12);
          border-color: rgba(34,197,94,0.28);
        }

        .chat-message.assistant {
          align-self: flex-start;
          background: var(--soft);
        }

        .chat-form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          border-top: 1px solid var(--border);
          padding: 12px 18px 16px;
        }

        .chat-form input {
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          min-height: 40px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text);
          font: inherit;
          font-size: 13px;
          padding: 0 12px;
        }

        .chat-form input:focus {
          border-color: rgba(34,197,94,0.58);
          outline: none;
        }

        .chat-error {
          margin: 0 18px 12px;
          border: 1px solid rgba(220,38,38,0.28);
          border-radius: 8px;
          background: rgba(220,38,38,0.08);
          color: #dc2626;
          font-size: 12px;
          padding: 10px 12px;
        }

        @media (max-width: 560px) {
          .chat-head,
          .chat-body,
          .chat-form {
            padding-left: 14px;
            padding-right: 14px;
          }

          .chat-head {
            flex-direction: column;
          }

          .chat-body {
            max-height: 42vh;
          }

          .chat-message {
            max-width: 100%;
          }

          .chat-form {
            grid-template-columns: 1fr;
          }

          .chat-form button {
            width: 100%;
          }
        }
      `}</style>

      <div className="chat-head">
        <div>
          <span className="eyebrow">Asistenti Gemini për bimën</span>
          <h2>Chatbot për bimën</h2>
        </div>
      </div>

      <div className="chat-body" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            {message.content}
          </div>
        ))}
        {loading && <div className="chat-message assistant">Duke menduar...</div>}
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pyet për ujitjen, temperaturën, lagështinë..."
          disabled={loading}
        />
        <button className="primary-button" type="submit" disabled={loading || !input.trim()}>
          {loading ? "duke pyetur" : "pyet"}
        </button>
      </form>
    </section>
  );
}
