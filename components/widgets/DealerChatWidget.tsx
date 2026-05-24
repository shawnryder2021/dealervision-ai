"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  slug: string;
  dealershipId: string;
  dealershipName: string;
  greeting?: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function DealerChatWidget({ slug, dealershipId, dealershipName, greeting }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        greeting ||
        `Hi! 👋 I'm here to help you explore inventory at ${dealershipName}. What kind of vehicle are you looking for?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // lead form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showLeadForm, leadDone]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — I hit a snag. Please try again, or request a quote and we'll follow up." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);
    if (!name.trim() || !email.trim()) {
      setLeadError("Name and email are required.");
      return;
    }
    setLeadSubmitting(true);
    try {
      const transcript = messages
        .slice(-8)
        .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
        .join("\n");
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealership_id: dealershipId,
          name,
          email,
          phone,
          source: "chat_widget",
          message: "Requested a quote from the website chat.",
          metadata: { transcript },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Submission failed");
      }
      setLeadDone(true);
      setShowLeadForm(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Thanks ${name.split(" ")[0]}! A team member from ${dealershipName} will reach out soon.` },
      ]);
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLeadSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--dv-primary)] focus:ring-1 focus:ring-[var(--dv-primary)]";

  return (
    <div className="flex h-screen max-h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: "var(--dv-primary)" }}>
        <span className="text-sm font-semibold">{dealershipName}</span>
        <span className="ml-auto text-[11px] opacity-80">AI Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user" ? "text-white" : "bg-slate-100 text-slate-800"
              }`}
              style={m.role === "user" ? { background: "var(--dv-primary)" } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-3.5 py-2 text-sm text-slate-400">…</div>
          </div>
        )}

        {/* Inline lead form */}
        {showLeadForm && !leadDone && (
          <form onSubmit={submitLead} className="space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-medium text-slate-600">Where should we send your quote?</p>
            <input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputCls} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {leadError && <p className="text-xs text-red-600">{leadError}</p>}
            <button
              type="submit"
              disabled={leadSubmitting}
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--dv-primary)" }}
            >
              {leadSubmitting ? "Sending…" : "Send"}
            </button>
          </form>
        )}
        <div ref={scrollRef} />
      </div>

      {/* CTA + input */}
      <div className="border-t border-slate-200 p-3">
        {!showLeadForm && !leadDone && (
          <button
            onClick={() => setShowLeadForm(true)}
            className="mb-2 w-full rounded-lg border border-[var(--dv-primary)] py-1.5 text-xs font-semibold"
            style={{ color: "var(--dv-primary)" }}
          >
            Get a personalized quote
          </button>
        )}
        <form onSubmit={send} className="flex items-center gap-2">
          <input
            className={inputCls}
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--dv-primary)" }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
