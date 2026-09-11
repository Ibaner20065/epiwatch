"use client";

import React, { useState } from "react";
import MorphIcon from "@/app/components/MorphIcon";

interface Citation {
  tool_name: string;
  source_label: string;
  provenance: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: Citation[];
  tools_used?: string[];
}

function renderFormattedMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    // Process markdown inline tokens: **bold**, `code`, _italic_
    const parts = line.split(/(\*\*.*?\*\*|`.*?`|_.*?_)/g);

    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={pIdx} className="font-semibold" style={{ color: "var(--fg)" }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 text-xs rounded"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--accent)",
              background: "var(--surface-muted)",
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
        return (
          <em key={pIdx} className="italic" style={{ color: "var(--fg-2)" }}>
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });

    const trimmed = line.trim();

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span className="font-bold shrink-0" style={{ color: "var(--accent)" }}>
            •
          </span>
          <div className="flex-1">{formattedLine}</div>
        </div>
      );
    }

    if (trimmed === "") {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return (
      <div key={lineIdx} className="my-0.5">
        {formattedLine}
      </div>
    );
  });
}

export default function AssistantChat({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Hello! I am EpiWatch AI Assistant. I provide grounded outbreak predictions, climate driver attributions, and census demographics directly sourced from your Supabase database and ML models. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assistantState, setAssistantState] = useState<"searching" | "answered">("answered");

  const samplePrompts = [
    "What is Pune's dengue risk next month?",
    "Why is Kolkata flagged high risk — what are the climate drivers?",
    "What is the livestock count of Nashik district?",
    "Compare Dengue vs Malaria in Mumbai.",
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);
    setAssistantState("searching");

    try {
      // Build history payload
      const historyPayload = messages.map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const apiBase = process.env.NEXT_API_URL || "https://epiwatch-xrhv.onrender.com";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${apiBase}/assistant/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend, history: historyPayload }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "assistant",
            text: data.answer,
            citations: data.citations,
            tools_used: data.tools_used,
          },
        ]);
        setAssistantState("answered");
      } else {
        throw new Error("Backend returned status " + res.status);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: "I was unable to reach the backend API. The server may be starting up — please try again in a moment.",
        },
      ]);
      setAssistantState("answered");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] flex flex-col"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-modal)",
        borderLeft: "1px solid var(--border)",
      }}
    >
      {/* ── Chat Header ── */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="ew-icon-circle"
            style={{
              width: 36,
              height: 36,
              background: "rgba(79, 110, 247, 0.1)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {/* FR-10 Grounding Indicator: MorphIcon searching ↔ answered */}
            <MorphIcon
              state={assistantState}
              size={20}
              color="var(--accent)"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--fg)" }}>
              EpiWatch AI Grounded Assistant
            </h3>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              Grounded in official IDSP, NASA POWER &amp; DAHD Census
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ew-btn-compact"
            style={{ height: 32, width: 32, padding: 0, borderRadius: "var(--radius-sm)" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Messages Container ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[88%] p-3.5 text-xs leading-relaxed ${
                m.sender === "user"
                  ? "rounded-xl text-white"
                  : "t-texts-reveal rounded-xl text-gray-800"
              }`}
              style={{
                borderRadius: "var(--radius-md)",
                background:
                  m.sender === "user"
                    ? "linear-gradient(135deg, var(--brand-start), var(--brand-end))"
                    : "var(--surface-muted)",
                color: m.sender === "user" ? "#FFFFFF" : "var(--fg)",
                boxShadow: m.sender === "user" ? "none" : "var(--shadow-border)",
              }}
            >
              {renderFormattedMarkdown(m.text)}

              {/* Citations & Provenance Tags */}
              {m.citations && m.citations.length > 0 && (
                <div
                  className="mt-3 pt-2 space-y-1.5 text-xs"
                  style={{
                    borderTop: `1px solid ${
                      m.sender === "user" ? "rgba(255,255,255,0.2)" : "var(--border)"
                    }`,
                  }}
                >
                  <p
                    className="ew-eyebrow font-semibold"
                    style={{
                      color: m.sender === "user" ? "rgba(255,255,255,0.7)" : "var(--accent)",
                    }}
                  >
                    Source Citations
                  </p>
                  {m.citations.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-md"
                      style={{
                        background:
                          m.sender === "user" ? "rgba(255,255,255,0.1)" : "var(--surface)",
                        boxShadow: m.sender === "user" ? "none" : "var(--shadow-border)",
                      }}
                    >
                      <span
                        className="font-medium text-[11px]"
                        style={{ color: m.sender === "user" ? "#fff" : "var(--fg)" }}
                      >
                        📌 {c.source_label}
                      </span>
                      <span
                        className="block text-[10px] mt-0.5"
                        style={{ color: m.sender === "user" ? "rgba(255,255,255,0.6)" : "var(--muted)" }}
                      >
                        {c.provenance}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* FR-10: t-shimmer-text while composing */}
        {loading && (
          <div className="flex items-center gap-2 p-3 text-xs" style={{ background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
            <MorphIcon state="searching" size={16} color="var(--accent)" />
            <span className="t-shimmer-text font-medium text-xs">
              Running grounded epidemiological tool queries...
            </span>
          </div>
        )}
      </div>

      {/* ── Suggested Prompts (8px radius, no pills) ── */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-muted)" }}
      >
        <p className="ew-eyebrow mb-2" style={{ fontSize: 10 }}>
          Suggested Queries
        </p>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((sp, i) => (
            <button
              key={i}
              onClick={() => handleSend(sp)}
              className="ew-btn-compact text-[11px]"
              style={{
                height: 28,
                padding: "0 10px",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface)",
              }}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Box (8px radius, explicitly NOT pill-shaped) ── */}
      <div
        className="p-3 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about risk forecasts, climate drivers..."
          className="ew-input flex-1 text-xs"
          style={{
            height: 44,
            borderRadius: "var(--radius-md)",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="ew-btn-primary"
          style={{
            height: 44,
            padding: "0 18px",
            borderRadius: "var(--radius-md)",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
