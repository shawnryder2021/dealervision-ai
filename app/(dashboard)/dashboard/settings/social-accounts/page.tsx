"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Loader,
  Trash2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

interface SocialAccount {
  id: string;
  provider: "facebook" | "instagram" | "twitter";
  account_name: string;
  provider_user_id: string;
  created_at: string;
}

export default function SocialAccountsPage() {
  const { dealership } = useAppStore();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<
    "facebook" | "instagram" | "twitter" | null
  >(null);

  useEffect(() => {
    loadAccounts();
  }, [dealership]);

  async function loadAccounts() {
    if (!dealership) return;
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to load social accounts", error);
    }
  }

  async function handleConnect(provider: "facebook" | "instagram" | "twitter") {
    setConnectingProvider(provider);
    try {
      const res = await fetch(
        `/api/social/auth/authorize?provider=${provider}`
      );
      if (!res.ok) throw new Error("Failed to get authorization URL");

      const { authUrl } = await res.json();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (error) {
      toast.error(
        `Failed to connect ${provider}. Make sure API keys are configured.`
      );
      setConnectingProvider(null);
    }
  }

  async function handleDisconnect(accountId: string) {
    if (!confirm("Disconnect this account?")) return;

    try {
      const res = await fetch(`/api/social/accounts?id=${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect");

      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast.success("Account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect account");
    }
  }

  const getIcon = (provider: string) => {
    switch (provider) {
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "facebook":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "instagram":
        return "bg-pink-100 text-pink-900 border-pink-300";
      case "twitter":
        return "bg-sky-100 text-sky-900 border-sky-300";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Share2 className="h-6 w-6 text-primary" />
          Social Media Accounts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your social media accounts to publish directly from DealerVision
        </p>
      </div>

      {/* Connected Accounts */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Connected Accounts</h2>

        {accounts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Share2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-heading text-lg font-semibold mb-1">
                No accounts connected
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Connect Facebook, Instagram, or Twitter to publish your generated assets
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {accounts.map((account) => (
              <Card key={account.id} className={`border ${getProviderColor(account.provider)}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border">
                      {getIcon(account.provider)}
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {account.provider}
                      </p>
                      <p className="text-xs opacity-75">{account.account_name}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connect New Account */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Connect Account</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { provider: "facebook" as const, icon: Facebook, label: "Facebook" },
            { provider: "instagram" as const, icon: Instagram, label: "Instagram" },
            { provider: "twitter" as const, icon: Twitter, label: "Twitter/X" },
          ].map(({ provider, icon: Icon, label }) => {
            const isConnected = accounts.some((a) => a.provider === provider);
            return (
              <Button
                key={provider}
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-6"
                onClick={() => handleConnect(provider)}
                disabled={isConnected || connectingProvider !== null}
              >
                {connectingProvider === provider ? (
                  <Loader className="h-6 w-6 animate-spin" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
                <span className="font-medium">{label}</span>
                {isConnected && (
                  <Badge variant="secondary" className="text-xs">
                    Connected
                  </Badge>
                )}
                {!isConnected && (
                  <span className="text-xs text-muted-foreground">Click to connect</span>
                )}
              </Button>
            );
          })}
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Once connected, you can publish your generated assets
            directly to these platforms from the asset library or create page.
          </p>
        </div>
      </div>
    </div>
  );
}
