"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchedRun, WeeklyRollup, buildCoachContext } from "@/lib/trainingFeedback";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How's my training going overall?",
  "Am I running my easy days too hard?",
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Ask Your Coach
        </CardTitle>
        <p className="text-xs text-neutral-400">Ask Claude about your training data, trends, or what to focus on.</p>
      </CardHeader>
      <CardContent>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1.5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div ref={scrollRef} className="max-h-96 overflow-y-auto space-y-3 mb-4 pr-1">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-50 text-neutral-800 border border-neutral-200"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 text-neutral-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 mb-3">{error}</p>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your training..."
            disabled={loading}
            className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 text-white disabled:opacity-30 hover:bg-neutral-800 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </CardContent>
    </Card>
  );
}