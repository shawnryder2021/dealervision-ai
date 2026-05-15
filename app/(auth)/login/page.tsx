"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wand2, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Translates raw Supabase auth errors into actionable messages the user
 * can actually do something about.
 */
function friendlyAuthError(rawMessage: string): {
  message: string;
  hint?: string;
} {
  const m = rawMessage.toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) {
    return {
      message: "Email or password is incorrect.",
      hint: "Double-check your email and password. Forgot your password? Use the link below to reset it.",
    };
  }
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return {
      message: "Please confirm your email before signing in.",
      hint: "Check your inbox (and spam folder) for the confirmation email we sent during signup.",
    };
  }
  if (m.includes("user not found") || m.includes("no user")) {
    return {
      message: "No account found with this email.",
      hint: "Did you mean to sign up? Use the link below to create an account.",
    };
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return {
      message: "Too many sign-in attempts.",
      hint: "Please wait a minute and try again.",
    };
  }
  if (m.includes("network") || m.includes("fetch")) {
    return {
      message: "Couldn't reach the server.",
      hint: "Check your internet connection and try again.",
    };
  }
  return { message: rawMessage || "Sign in failed. Please try again." };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      if (isMagicLink) {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (err) throw err;
        toast.success("Check your email — we sent you a magic link to sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      const friendly = friendlyAuthError(message);
      setError(friendly);
      toast.error(friendly.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to DealerVision AI
          </p>
        </div>

        <Card className="glass">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Inline error banner */}
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 flex gap-2.5">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">{error.message}</p>
                    {error.hint && (
                      <p className="text-muted-foreground text-xs mt-1">{error.hint}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    placeholder="you@dealership.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>

              {!isMagicLink && (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-9 pr-10 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 gradient-primary text-white text-base"
                disabled={isLoading || !email || (!isMagicLink && !password)}
              >
                {isLoading
                  ? "Signing in…"
                  : isMagicLink
                    ? "Send Magic Link"
                    : "Sign In"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsMagicLink(!isMagicLink);
                  setError(null);
                }}
                className="text-xs text-primary hover:underline w-full text-center"
              >
                {isMagicLink
                  ? "Sign in with password instead"
                  : "Sign in with a magic link instead"}
              </button>
            </div>

            <Separator className="my-6" />

            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
