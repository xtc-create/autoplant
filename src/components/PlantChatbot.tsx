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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Me pyet per bimen, ujitjen, lageshtine, temperaturen ose leximin e fundit te sensorit.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function openChat() {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }

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
    <section className={`plant-chat ${open ? "open" : ""}`} aria-label="Plant AI chat">
      <style>{`
        .plant-chat {
          position: fixed;
          right: max(18px, env(safe-area-inset-right));
          bottom: max(18px, env(safe-area-inset-bottom));
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          pointer-events: none;
        }

        .chat-launcher {
          display: grid;
          width: 58px;
          height: 58px;
          min-height: 58px;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 16px 36px rgba(15,23,42,0.22);
          color: #ffffff;
          padding: 0;
          pointer-events: auto;
        }

        .chat-launcher-mark {
          display: block;
          width: 36px;
          height: 36px;
          object-fit: contain;
        }

        .chat-panel {
          display: none;
          width: min(430px, calc(100vw - 28px));
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          box-shadow: 0 22px 55px rgba(15,23,42,0.22);
          pointer-events: auto;
        }

        .plant-chat.open .chat-panel {
          display: block;
          animation: chat-pop 160ms ease-out;
        }

        .plant-chat.open .chat-launcher {
          display: none;
        }

        .chat-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding: 14px 18px;
        }

        .chat-head h2 {
          margin: 0;
          font-size: 17px;
        }

        .chat-subtitle {
          margin: 3px 0 0;
          color: var(--muted);
          font-size: 12px;
        }

        .chat-close {
          display: grid;
          width: 34px;
          min-width: 34px;
          min-height: 34px;
          place-items: center;
          padding: 0;
          color: var(--muted);
          font-size: 18px;
        }

        .chat-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: min(420px, 54vh);
          overflow-y: auto;
          padding: 16px 18px;
        }

        .chat-message {
          max-width: min(84%, 760px);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
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
          font-size: 14px;
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
          font-size: 13px;
          padding: 10px 12px;
        }

        @keyframes chat-pop {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 560px) {
          .plant-chat {
            right: 12px;
            bottom: max(14px, env(safe-area-inset-bottom));
          }

          .chat-panel {
            width: calc(100vw - 24px);
          }

          .chat-launcher {
            width: 54px;
            height: 54px;
            min-height: 54px;
          }

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

      <div className="chat-panel">
        <div className="chat-head">
          <div>
            <h2>Asistenti AutoPlant</h2>
            <p className="chat-subtitle">Kujdesi per bimen</p>
          </div>
          <button className="chat-close" type="button" onClick={() => setOpen(false)} aria-label="Mbyll chat-in">
            x
          </button>
        </div>

        <div className="chat-body" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
              <ChatText text={message.content} />
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
            placeholder="Pyet per ujitjen, temperaturen, lageshtine..."
            disabled={loading}
          />
          <button className="primary-button" type="submit" disabled={loading || !input.trim()}>
            {loading ? "duke pyetur" : "pyet"}
          </button>
        </form>
      </div>

      <button className="chat-launcher" type="button" onClick={openChat} aria-expanded={open} aria-label="Open chat">
        <img className="chat-launcher-mark" src="/chat-logo.png" alt="" aria-hidden="true" />
      </button>
    </section>
  );
}
