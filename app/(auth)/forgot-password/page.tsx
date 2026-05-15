"use client";

import { useState } from "react";
import Link from "next/link";
import { Wand2, Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent — check your email.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't send reset email";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password
            reset link. Click it to set a new password.
          </p>
          <Card className="glass text-left">
            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
              <p>• Check your spam folder if you don&apos;t see it</p>
              <p>• The reset link expires in 1 hour</p>
              <p>• Use the link in your email to choose a new password</p>
            </CardContent>
          </Card>
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Send to a different email
            </Button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Enter the email you used to sign up. We&apos;ll send you a link to choose a
            new password.
          </p>
        </div>

        <Card className="glass">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 gradient-primary text-white"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
