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
          <strong key={pIdx} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code key={pIdx} className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[11px] border border-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
        return (
          <em key={pIdx} className="italic text-slate-400">
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
          <span className="text-indigo-400 font-bold shrink-0">•</span>
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
      // Try hitting backend API first, fallback to offline response generator
      const res = await fetch("http://127.0.0.1:8000/assistant/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend }),
      });

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
        throw new Error("Backend offline");
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#090912]/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col font-sans text-slate-100">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow">
            💬
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">EpiWatch Conversational AI</h3>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Grounded Anti-Hallucination Guardrails
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                m.sender === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg"
              }`}
            >
              {renderFormattedMarkdown(m.text)}

              {/* Citations & Provenance Tags */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[10px] font-mono">
                  <p className="text-indigo-400 font-bold uppercase tracking-wider">Source Provenance Citations:</p>
                  {m.citations.map((c, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400 flex flex-col">
                      <span className="text-slate-200 font-semibold">📌 {c.source_label}</span>
                      <span className="text-[9px] text-slate-500">{c.provenance}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono p-2">
            <span className="animate-spin text-base">⚡</span> Running grounded tool queries...
          </div>
        )}
      </div>

      {/* Sample Prompt Pills */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Suggested Questions:</p>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((sp, i) => (
            <button
              key={i}
              onClick={() => handleSend(sp)}
              className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition text-left"
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about risk forecasts, climate drivers, or census demographics..."
          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs shadow transition"
        >
          Send
        </button>
      </div>

    </div>
  );
}
