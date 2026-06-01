"use client";

import { FormEvent, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function renderMarkdownLine(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

function ChatText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => {
        const bullet = line.match(/^\s*[*-]\s+(.*)$/);

        return (
          <p className={bullet ? "chat-line bullet" : "chat-line"} key={index}>
            {bullet ? renderMarkdownLine(bullet[1]) : renderMarkdownLine(line)}
          </p>
        );
      })}
    </>
  );
}

export default function PlantChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ask me about your plant, watering, humidity, temperature, or the latest sensor reading.",
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
          margin: 0;
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
          overflow-wrap: anywhere;
        }

        .chat-line {
          margin: 0;
          min-height: 1.55em;
        }

        .chat-line + .chat-line {
          margin-top: 4px;
        }

        .chat-line.bullet {
          position: relative;
          padding-left: 16px;
        }

        .chat-line.bullet::before {
          content: "";
          position: absolute;
          left: 3px;
          top: 0.72em;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
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
        <h2>Plant AI</h2>
      </div>

      <div className="chat-body" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            <ChatText text={message.content} />
          </div>
        ))}
        {loading && <div className="chat-message assistant">Thinking...</div>}
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about watering, temperature, humidity..."
          disabled={loading}
        />
        <button className="primary-button" type="submit" disabled={loading || !input.trim()}>
          {loading ? "asking" : "ask"}
        </button>
      </form>
    </section>
  );
}
