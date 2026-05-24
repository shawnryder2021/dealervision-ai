"use client";

import { useEffect, useState } from "react";
import type { WidgetVehicle } from "@/lib/widgets/dealership";

interface Props {
  slug: string;
  dealershipName: string;
  /** Optional vehicle to pre-select (e.g. when embedded on a VDP). */
  initialVehicleId?: string;
}

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

export function BookingWidget({ slug, dealershipName, initialVehicleId }: Props) {
  const [vehicles, setVehicles] = useState<WidgetVehicle[]>([]);
  const [vehicleId, setVehicleId] = useState(initialVehicleId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/widget/${slug}/vehicles?limit=100`)
      .then((r) => (r.ok ? r.json() : { vehicles: [] }))
      .then((d) => setVehicles(d.vehicles ?? []))
      .catch(() => setVehicles([]));
  }, [slug]);

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--dv-primary)] focus:ring-1 focus:ring-[var(--dv-primary)]";
  const btnCls =
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50";

  // Min date = today (yyyy-mm-dd)
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !date) {
      setError("Name, email, and a date are required.");
      return;
    }
    const requested_at = new Date(`${date} ${time}`).toISOString();
    setSubmitting(true);
    try {
      const res = await fetch("/api/widget/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customer_name: name,
          email,
          phone,
          vehicle_id: vehicleId || null,
          requested_at,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Booking failed");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ background: "var(--dv-primary)" }}
        >
          ✓
        </div>
        <h2 className="text-lg font-bold">Test drive requested!</h2>
        <p className="mt-2 text-sm text-slate-600">
          {dealershipName} will confirm your {date} at {time} appointment shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3 p-5">
      <h2 className="text-lg font-bold">Book a test drive</h2>
      <p className="text-sm text-slate-600">Pick a vehicle and a time at {dealershipName}.</p>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Vehicle</label>
        <select className={inputCls} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">Not sure yet / general</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
              {v.stock_number ? ` (#${v.stock_number})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
          <input className={inputCls} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Time</label>
          <select className={inputCls} value={time} onChange={(e) => setTime(e.target.value)}>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={inputCls} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={inputCls} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className={btnCls} style={{ background: "var(--dv-primary)" }}>
        {submitting ? "Requesting…" : "Request test drive"}
      </button>
    </form>
  );
}
