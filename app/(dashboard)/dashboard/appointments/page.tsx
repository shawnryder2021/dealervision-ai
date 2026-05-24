"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock, Mail, Phone, Car, Clock, RefreshCw, Check, X, CheckCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { AppointmentStatus } from "@/lib/types";

interface ApptVehicle {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
}

interface Appointment {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  requested_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  vehicle: ApptVehicle | null;
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  requested: "bg-amber-500/10 text-amber-600",
  confirmed: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-slate-500/10 text-slate-500",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
        setPendingCount(data.pending_count || 0);
      }
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    const prev = appointments;
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked ${status}`);
      setPendingCount((c) => (status !== "requested" ? Math.max(0, c - 1) : c));
    } catch {
      setAppointments(prev);
      toast.error("Couldn't update appointment");
    }
  };

  const vehicleLabel = (v: ApptVehicle | null) =>
    v ? [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ") : "General inquiry";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Appointments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Test-drive requests from your booking widget
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-amber-500/10 text-amber-600">{pendingCount} to confirm</Badge>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchAppointments}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : appointments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarClock className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold mb-1">No appointments yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Add the test-drive booking widget to your website to start collecting requests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.id} className={appt.status === "requested" ? "border-amber-500/30 bg-amber-500/5" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-semibold text-sm">{appt.customer_name}</p>
                      <Badge className={`text-[10px] capitalize px-1.5 py-0 ${STATUS_STYLES[appt.status]}`}>
                        {appt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <Car className="h-3.5 w-3.5" /> {vehicleLabel(appt.vehicle)}
                    </p>
                    <p className="text-sm font-medium flex items-center gap-1 mb-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {new Date(appt.requested_at).toLocaleString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a href={`mailto:${appt.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3.5 w-3.5" /> {appt.email}
                      </a>
                      {appt.phone && (
                        <a href={`tel:${appt.phone}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="h-3.5 w-3.5" /> {appt.phone}
                        </a>
                      )}
                    </div>
                    {appt.notes && <p className="text-sm text-muted-foreground mt-2">{appt.notes}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {appt.status === "requested" && (
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => updateStatus(appt.id, "confirmed")}>
                        <Check className="h-3 w-3" /> Confirm
                      </Button>
                    )}
                    {(appt.status === "requested" || appt.status === "confirmed") && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateStatus(appt.id, "completed")}>
                          <CheckCheck className="h-3 w-3" /> Completed
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => updateStatus(appt.id, "cancelled")}>
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
