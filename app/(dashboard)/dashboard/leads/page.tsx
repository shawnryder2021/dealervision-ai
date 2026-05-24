"use client";

import { useEffect, useState } from "react";
import {
  Users, Mail, Phone, MessageSquare, Clock, CheckCircle2,
  RefreshCw, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  vehicle_interest: string | null;
  landing_page_title: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

const SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
  landing_page: { label: "Landing Page", cls: "bg-slate-500/10 text-slate-600" },
  chat_widget: { label: "Website Chat", cls: "bg-violet-500/10 text-violet-600" },
  trade_in: { label: "Trade-In", cls: "bg-emerald-500/10 text-emerald-600" },
  test_drive: { label: "Test Drive", cls: "bg-blue-500/10 text-blue-600" },
  api: { label: "API", cls: "bg-slate-500/10 text-slate-600" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLeads = async (filterUnread = unreadOnly) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads${filterUnread ? "?unread=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const markAsRead = async (id: string) => {
    await fetch(`/api/leads?mark_read=${id}`);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, read_at: new Date().toISOString() } : l));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const toggleFilter = () => {
    const next = !unreadOnly;
    setUnreadOnly(next);
    fetchLeads(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Leads
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Contact form submissions from your landing pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-primary/10 text-primary">{unreadCount} new</Badge>
          )}
          <Button variant="outline" size="sm" onClick={toggleFilter} className={unreadOnly ? "border-primary text-primary" : ""}>
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            {unreadOnly ? "Unread only" : "All leads"}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchLeads()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold mt-0.5">{leads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">Unread</p>
            <p className="text-2xl font-bold mt-0.5 text-primary">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-muted-foreground">This week</p>
            <p className="text-2xl font-bold mt-0.5">
              {leads.filter((l) => {
                const d = new Date(l.created_at);
                const now = new Date();
                return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lead list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : leads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold mb-1">No leads yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Enable contact forms on your landing pages to start collecting leads from visitors.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card
              key={lead.id}
              className={`transition-all ${!lead.read_at ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <p className="font-semibold text-sm">{lead.name}</p>
                      {!lead.read_at && (
                        <Badge className="text-[10px] bg-primary/10 text-primary px-1.5 py-0">New</Badge>
                      )}
                      {(() => {
                        const s = SOURCE_LABELS[lead.source];
                        return s ? (
                          <Badge className={`text-[10px] px-1.5 py-0 ${s.cls}`}>{s.label}</Badge>
                        ) : null;
                      })()}
                      {lead.landing_page_title && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {lead.landing_page_title}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <Mail className="h-3.5 w-3.5" />
                        {lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </a>
                      )}
                    </div>

                    {lead.vehicle_interest && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">Interested in:</span> {lead.vehicle_interest}
                      </p>
                    )}
                    {lead.message && (
                      <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {lead.message}
                      </p>
                    )}
                    {lead.source === "trade_in" && lead.metadata && (
                      <div className="mt-2 rounded-md bg-emerald-500/5 border border-emerald-500/15 p-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Trade-in:</span>{" "}
                        {String(lead.metadata.trade_year ?? "")} {String(lead.metadata.trade_make ?? "")}{" "}
                        {String(lead.metadata.trade_model ?? "")} · {String(lead.metadata.trade_mileage ?? "?")} mi ·{" "}
                        {String(lead.metadata.trade_condition ?? "")}
                        {lead.metadata.estimate_low != null && (
                          <> · est. ${Number(lead.metadata.estimate_low).toLocaleString()}–$
                            {Number(lead.metadata.estimate_high).toLocaleString()}</>
                        )}
                      </div>
                    )}
                    {lead.source === "chat_widget" && typeof lead.metadata?.transcript === "string" && (
                      <details className="mt-2 text-xs text-muted-foreground">
                        <summary className="cursor-pointer font-medium text-foreground">Chat transcript</summary>
                        <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-2">{lead.metadata.transcript}</pre>
                      </details>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(lead.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                    {!lead.read_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => markAsRead(lead.id)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Mark read
                      </Button>
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
