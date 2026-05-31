"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PlantChatbot;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function PlantChatbot() {
    const [messages, setMessages] = (0, react_1.useState)([
        {
            role: "assistant",
            content: "Më pyet për bimën, ujitjen, lagështinë, temperaturën ose leximin më të fundit të sensorëve.",
        },
    ]);
    const [input, setInput] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const inputRef = (0, react_1.useRef)(null);
    async function handleSubmit(event) {
        event.preventDefault();
        const text = input.trim();
        if (!text || loading)
            return;
        const nextMessages = [...messages, { role: "user", content: text }];
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
        }
        catch (err) {
            setError(err.message);
            setMessages(nextMessages);
        }
        finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }
    return ((0, jsx_runtime_1.jsxs)("section", { className: "plant-chat panel", children: [(0, jsx_runtime_1.jsx)("style", { children: `
        .plant-chat {
          margin-top: 12px;
          overflow: hidden;
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
          max-height: 360px;
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

          .chat-message {
            max-width: 100%;
          }

          .chat-form {
            grid-template-columns: 1fr;
          }
        }
      ` }), (0, jsx_runtime_1.jsx)("div", { className: "chat-head", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "eyebrow", children: "Asistenti Gemini p\u00EBr bim\u00EBn" }), (0, jsx_runtime_1.jsx)("h2", { children: "Chatbot p\u00EBr bim\u00EBn" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "chat-body", "aria-live": "polite", children: [messages.map((message, index) => ((0, jsx_runtime_1.jsx)("div", { className: `chat-message ${message.role}`, children: message.content }, `${message.role}-${index}`))), loading && (0, jsx_runtime_1.jsx)("div", { className: "chat-message assistant", children: "Duke menduar..." })] }), error && (0, jsx_runtime_1.jsx)("div", { className: "chat-error", children: error }), (0, jsx_runtime_1.jsxs)("form", { className: "chat-form", onSubmit: handleSubmit, children: [(0, jsx_runtime_1.jsx)("input", { ref: inputRef, value: input, onChange: (event) => setInput(event.target.value), placeholder: "Pyet p\u00EBr ujitjen, temperatur\u00EBn, lag\u00EBshtin\u00EB...", disabled: loading }), (0, jsx_runtime_1.jsx)("button", { className: "primary-button", type: "submit", disabled: loading || !input.trim(), children: loading ? "duke pyetur" : "pyet" })] })] }));
}
