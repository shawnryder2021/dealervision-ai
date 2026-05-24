"use client";

import { useState } from "react";
import { estimateTradeIn, type VehicleCondition, type TradeInEstimate } from "@/lib/trade-in-estimate";

interface Props {
  dealershipId: string;
  dealershipName: string;
}

const CONDITIONS: { value: VehicleCondition; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export function TradeInWidget({ dealershipId, dealershipName }: Props) {
  const [step, setStep] = useState<"vehicle" | "result">("vehicle");
  const [estimate, setEstimate] = useState<TradeInEstimate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // vehicle
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState<VehicleCondition>("good");
  // contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleEstimate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const yr = parseInt(year, 10);
    const mi = parseInt(mileage.replace(/[^0-9]/g, ""), 10) || 0;
    if (!yr || !make.trim()) {
      setError("Please enter at least the year and make.");
      return;
    }
    setEstimate(estimateTradeIn({ year: yr, make, model, mileage: mi, condition }));
    setStep("result");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealership_id: dealershipId,
          name,
          email,
          phone,
          source: "trade_in",
          vehicle_interest: `Trade-in: ${year} ${make} ${model}`.trim(),
          message: `Trade-in estimate request. Est. range $${estimate?.low.toLocaleString()}–$${estimate?.high.toLocaleString()}.`,
          metadata: {
            trade_year: year,
            trade_make: make,
            trade_model: model,
            trade_mileage: mileage,
            trade_condition: condition,
            estimate_low: estimate?.low,
            estimate_high: estimate?.high,
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Submission failed");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--dv-primary)] focus:ring-1 focus:ring-[var(--dv-primary)]";
  const btnCls =
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50";

  if (done) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ background: "var(--dv-primary)" }}
        >
          ✓
        </div>
        <h2 className="text-lg font-bold">Thanks, {name.split(" ")[0]}!</h2>
        <p className="mt-2 text-sm text-slate-600">
          {dealershipName} will reach out shortly with a firm trade-in offer for your{" "}
          {year} {make} {model}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-5">
      {step === "vehicle" && (
        <form onSubmit={handleEstimate} className="space-y-3">
          <h2 className="text-lg font-bold">What&apos;s your trade worth?</h2>
          <p className="text-sm text-slate-600">
            Get an instant ballpark estimate from {dealershipName}.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
            <input className={inputCls} placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
          </div>
          <input className={inputCls} placeholder="Model (optional)" value={model} onChange={(e) => setModel(e.target.value)} />
          <input className={inputCls} placeholder="Mileage" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Condition</label>
            <div className="grid grid-cols-4 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCondition(c.value)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    condition === c.value
                      ? "border-[var(--dv-primary)] text-[var(--dv-primary)]"
                      : "border-slate-300 text-slate-600"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className={btnCls} style={{ background: "var(--dv-primary)" }}>
            Get my estimate
          </button>
        </form>
      )}

      {step === "result" && estimate && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Estimated trade-in value</p>
            <p className="my-1 text-2xl font-bold" style={{ color: "var(--dv-primary)" }}>
              ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400">{estimate.assumptions[estimate.assumptions.length - 1]}</p>
          </div>
          <p className="text-sm font-medium text-slate-700">Get your firm offer — where should we send it?</p>
          <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputCls} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputCls} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className={btnCls} style={{ background: "var(--dv-primary)" }}>
            {submitting ? "Sending…" : "Get my firm offer"}
          </button>
          <button
            type="button"
            onClick={() => setStep("vehicle")}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700"
          >
            ← Edit vehicle details
          </button>
        </form>
      )}
    </div>
  );
}
