"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StripeConfig {
  id: string;
  publishable_key: string;
  webhook_secret: string;
  account_id: string | null;
  test_mode: boolean;
  configured_at: string;
  configured_by: string;
  last_tested_at: string | null;
  last_test_status: string | null;
}

export default function StripeConfigPage() {
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testMode, setTestMode] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/stripe-config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        if (data.config) {
          setPublishableKey(data.config.publishable_key || "");
          setWebhookSecret(data.config.webhook_secret || "");
          setTestMode(data.config.test_mode ?? true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch Stripe config:", error);
      toast.error("Failed to load Stripe configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!secretKey || !publishableKey || !webhookSecret) {
      toast.error("All fields are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/stripe-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret_key: secretKey,
          publishable_key: publishableKey,
          webhook_secret: webhookSecret,
          test_mode: testMode,
        }),
      });

      if (res.ok) {
        toast.success("Stripe configuration saved");
        setSecretKey("");
        await fetchConfig();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!secretKey) {
      toast.error("Enter Secret Key to test");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/admin/stripe-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          secret_key: secretKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Connection verified!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Connection test failed");
      }
      await fetchConfig();
    } catch (error) {
      console.error("Error testing connection:", error);
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Stripe Configuration
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">Loading...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Stripe Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage Stripe API credentials and webhook configuration
        </p>
      </div>

      {/* Current Status */}
      {config && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-2">Current Configuration</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Mode:{" "}
                    <Badge className={config.test_mode ? "" : "bg-red-500/10 text-red-600"}>
                      {config.test_mode ? "Test" : "Live"}
                    </Badge>
                  </p>
                  <p>
                    Configured by: <span className="font-mono">{config.configured_by}</span>
                  </p>
                  <p>
                    Configured at:{" "}
                    <span className="font-mono">
                      {new Date(config.configured_at).toLocaleDateString()}
                    </span>
                  </p>
                  {config.last_tested_at && (
                    <p>
                      Last tested:{" "}
                      {config.last_test_status === "success" ? (
                        <Badge className="bg-green-500/10 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Stripe Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Secret Key</label>
            <Input
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              From Stripe Dashboard → API Keys
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Publishable Key</label>
            <Input
              type="text"
              placeholder="pk_test_..."
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              From Stripe Dashboard → API Keys
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Webhook Secret</label>
            <Input
              type="password"
              placeholder="whsec_..."
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              From Stripe Dashboard → Webhooks → Select endpoint
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="testMode"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="testMode" className="text-sm">
              Test Mode (leave checked for development)
            </label>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              onClick={handleTest}
              disabled={testing}
              variant="outline"
              className="flex-1"
            >
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">1. Get API Keys</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
              <li>Go to https://dashboard.stripe.com</li>
              <li>Navigate to API Keys</li>
              <li>Copy Secret Key and Publishable Key</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Register Webhook Endpoint</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
              <li>Navigate to Webhooks in Stripe Dashboard</li>
              <li>Click "Add Endpoint"</li>
              <li>
                URL: <code className="bg-muted px-2 py-1 rounded text-xs">
                  https://yourdomain.com/api/stripe/webhooks
                </code>
              </li>
              <li>Select events: subscription created/updated/deleted, invoice payment_succeeded/failed</li>
              <li>Copy the Signing Secret</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Test & Deploy</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
              <li>Click "Test Connection" above to verify keys</li>
              <li>For production: Switch to live mode in Stripe Dashboard and get live keys</li>
              <li>Update environment variables on your hosting platform</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
