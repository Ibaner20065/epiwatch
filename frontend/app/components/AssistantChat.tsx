"use client";

import React, { useState } from "react";

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
          <strong key={pIdx} className="font-bold" style={{ color: 'var(--bp-white)' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 font-mono text-[10px] border border-[var(--bp-line-faint)]" style={{ color: 'var(--bp-cyan)', background: 'rgba(0,20,40,0.5)' }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
        return (
          <em key={pIdx} className="italic bp-note">
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
          <span className="font-bold shrink-0" style={{ color: 'var(--bp-cyan)' }}>+</span>
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

  const samplePrompts = [
    "What is the local district's dengue risk next month?",
    "Why is Kolkata flagged high risk — what are the climate drivers?",
    "What is the population density of Bengaluru Urban?",
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

    try {
      // Build history payload
      const historyPayload = messages.map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
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
      } else {
        throw new Error("Backend returned status " + res.status);
      }
    } catch (e) {
      // Show honest error — never fabricate data
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: `⚠️ **Backend Unreachable** — The EpiWatch API server is not responding. I cannot provide predictions without a live connection to the database.\n\nPlease ensure the backend server is running at \`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}\` and try again.\n\n_EpiWatch does not generate approximate or estimated answers when the data source is unavailable._`,
          citations: [],
          tools_used: ["connection_error"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] border-l border-[var(--bp-line-faint)] shadow-2xl backdrop-blur-xl flex flex-col font-mono" style={{ background: 'rgba(0, 25, 50, 0.95)', color: 'var(--bp-white-soft)' }}>
      
      {/* Header */}
      <div className="p-4 border-b border-[var(--bp-line-faint)] flex items-center justify-between" style={{ background: 'rgba(0, 20, 40, 0.8)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 border border-dashed border-[var(--bp-cyan)] flex items-center justify-center font-bold text-sm" style={{ color: 'var(--bp-cyan)' }}>
            💬
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--bp-white-soft)' }}>
              <span className="bp-serial">[AI-01]</span> EpiWatch AI
            </h3>
            <p className="text-[9px] font-mono flex items-center gap-1" style={{ color: 'var(--bp-cyan)' }}>
              <span className="w-1.5 h-1.5 bg-[var(--bp-cyan)]" style={{ animation: 'bp-pulse 2s ease-in-out infinite' }} />
              Grounded Anti-Hallucination Guardrails
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="bp-btn text-[9px] px-2 py-1"
          >
            ✕ CLOSE
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[10px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] p-3 leading-relaxed whitespace-pre-wrap ${
                m.sender === "user"
                  ? "border border-[var(--bp-redline)] bg-[rgba(255,51,51,0.08)]"
                  : "border border-[var(--bp-line-faint)] bg-[rgba(0,20,40,0.5)]"
              }`}
              style={{ color: m.sender === "user" ? 'var(--bp-white-soft)' : 'var(--bp-white-muted)' }}
            >
              {renderFormattedMarkdown(m.text)}

              {/* Citations & Provenance Tags */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[var(--bp-line-faint)] space-y-1 text-[9px] font-mono">
                  <p className="font-bold uppercase tracking-widest" style={{ color: 'var(--bp-cyan)' }}>Source Provenance Citations:</p>
                  {m.citations.map((c, idx) => (
                    <div key={idx} className="p-1.5 border border-[var(--bp-line-faint)] flex flex-col" style={{ background: 'rgba(0,15,30,0.5)' }}>
                      <span className="font-bold" style={{ color: 'var(--bp-white-muted)' }}>📌 {c.source_label}</span>
                      <span className="text-[8px]" style={{ color: 'var(--bp-white-faint)' }}>{c.provenance}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-[10px] font-mono p-2" style={{ color: 'var(--bp-cyan)' }}>
            <span className="text-base" style={{ animation: 'bp-spin 2s linear infinite', display: 'inline-block' }}>⚡</span>
            Running grounded tool queries...
          </div>
        )}
      </div>

      {/* Sample Prompt Pills */}
      <div className="p-3 border-t border-[var(--bp-line-faint)]" style={{ background: 'rgba(0,15,30,0.5)' }}>
        <p className="text-[9px] uppercase font-bold tracking-widest mb-1.5" style={{ color: 'var(--bp-white-faint)' }}>Suggested Queries:</p>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((sp, i) => (
            <button
              key={i}
              onClick={() => handleSend(sp)}
              className="px-2 py-1 text-[9px] border border-[var(--bp-line-faint)] hover:border-[var(--bp-cyan-dim)] transition text-left font-mono" style={{ color: 'var(--bp-white-muted)', background: 'transparent' }}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-[var(--bp-line-faint)] flex items-center gap-2" style={{ background: 'rgba(0,20,40,0.8)' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Query risk forecasts, climate drivers, demographics..."
          className="flex-1 px-3 py-2 border border-[var(--bp-line-faint)] text-[10px] font-mono focus:outline-none focus:border-[var(--bp-cyan)]"
          style={{ background: 'rgba(0,15,30,0.5)', color: 'var(--bp-white-soft)' }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="bp-btn bp-btn-active px-4 py-2 text-[10px]"
        >
          TRANSMIT
        </button>
      </div>

    </div>
  );
}
