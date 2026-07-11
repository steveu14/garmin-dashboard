"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchedRun, WeeklyRollup, buildCoachContext } from "@/lib/trainingFeedback";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How's my training going?",
  "Am I running easy days too hard?",
  "What should I focus on this week?",
];

export default function CoachChat({ rollups, runs }: { rollups: WeeklyRollup[]; runs: MatchedRun[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const context = buildCoachContext(rollups, runs);
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[420px] lg:min-h-0 rounded-xl border border-[var(--color-paper-line)] bg-[var(--color-paper-dim)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-paper-line)] bg-[var(--color-void)] text-white shrink-0">
        <div className="flex items-center gap-1.5 eyebrow text-xs">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-bib)]" />
          Coach
        </div>
        <p className="text-[11px] text-white/50 mt-1 normal-case font-body tracking-normal">
          Ask about trends, pace, or what to focus on.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-xs text-[var(--color-ink-soft)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-dim)] border border-[var(--color-paper-line)] rounded-lg px-3 py-2 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "rounded-lg px-3.5 py-2.5 text-sm max-w-[90%] whitespace-pre-wrap leading-relaxed",
                m.role === "user"
                  ? "bg-[var(--color-void)] text-white"
                  : "bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-paper-line)]"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3.5 py-2.5 text-sm bg-[var(--color-paper)] border border-[var(--color-paper-line)] text-[var(--color-ink-faint)] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="font-mono-data text-xs">thinking</span>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-[var(--color-flag-red)]">{error}</p>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 p-3 border-t border-[var(--color-paper-line)] shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach..."
          disabled={loading}
          className="flex-1 text-sm border border-[var(--color-paper-line)] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-bib)] disabled:opacity-50 bg-[var(--color-paper)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-bib)] text-white disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
