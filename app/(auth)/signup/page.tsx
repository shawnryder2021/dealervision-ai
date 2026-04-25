"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wand2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  WizardFormData,
  Step1AccountDealership,
  Step2BrandIdentity,
  Step3Inventory,
  Step4Coupon,
  Step5Complete,
} from "@/components/onboarding/wizard-steps";

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState<WizardFormData>({
    fullName: "",
    dealershipName: "",
    email: "",
    password: "",
    brandVoice: "",
    primaryColor: "#0066FF",
    secondaryColor: "#FF6600",
    inventoryType: "",
    manufacturerBrand: "",
    appliedCoupon: null,
  });

  const handleNext = async () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      setError(undefined);
    } else {
      // Step 5 - Complete signup
      await handleSignup();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(undefined);
    }
  };

  async function handleSignup() {
    setIsLoading(true);
    setError(undefined);

    try {
      const supabase = createClient();

      // Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            dealership_name: formData.dealershipName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (authError) throw authError;

      if (!data.user) {
        throw new Error("Signup failed — please try again.");
      }

      // Create dealership and profile via server API
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user.id,
          full_name: formData.fullName,
          dealership_name: formData.dealershipName,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          brand_voice: formData.brandVoice,
          inventory_type: formData.inventoryType,
          manufacturer_brand: formData.manufacturerBrand || null,
          coupon_id: formData.appliedCoupon?.id || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to create your account");
      }

      setConfirmationEmail(formData.email);

      if (data.session) {
        // Email confirmation is disabled — redirect immediately
        toast.success("Account created! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        // Email confirmation is enabled
        setNeedsConfirmation(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We sent a confirmation link to <strong>{confirmationEmail}</strong>. Click the
            link to activate your account and get started.
          </p>
          <Card className="glass text-left">
            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
              <p>• Check your spam folder if you don&apos;t see it</p>
              <p>• The link expires in 24 hours</p>
              <p>• Once confirmed, you&apos;ll be taken directly to your dashboard</p>
            </CardContent>
          </Card>
          <p className="mt-6 text-sm text-muted-foreground">
            Already confirmed?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Get Started with DealerAdGen</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {currentStep === 1 && "Step 1 of 5 — Account Setup"}
            {currentStep === 2 && "Step 2 of 5 — Brand Identity"}
            {currentStep === 3 && "Step 3 of 5 — Inventory Setup"}
            {currentStep === 4 && "Step 4 of 5 — Coupon (Optional)"}
            {currentStep === 5 && "Step 5 of 5 — Review"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all ${
                step <= currentStep ? "gradient-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <Card className="glass">
          <CardContent className="pt-8 pb-8">
            {currentStep === 1 && (
              <Step1AccountDealership
                data={formData}
                onChange={(updates) => setFormData({ ...formData, ...updates })}
                onNext={handleNext}
                isLoading={isLoading}
                error={error}
              />
            )}

            {currentStep === 2 && (
              <Step2BrandIdentity
                data={formData}
                onChange={(updates) => setFormData({ ...formData, ...updates })}
                currentStep={currentStep}
                onNext={handleNext}
                onPrev={handlePrev}
                isLoading={isLoading}
              />
            )}

            {currentStep === 3 && (
              <Step3Inventory
                data={formData}
                onChange={(updates) => setFormData({ ...formData, ...updates })}
                currentStep={currentStep}
                onNext={handleNext}
                onPrev={handlePrev}
                isLoading={isLoading}
              />
            )}

            {currentStep === 4 && (
              <Step4Coupon
                data={formData}
                onChange={(updates) => setFormData({ ...formData, ...updates })}
                currentStep={currentStep}
                onNext={handleNext}
                onPrev={handlePrev}
                isLoading={isLoading}
              />
            )}

            {currentStep === 5 && (
              <Step5Complete onComplete={handleNext} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {currentStep === 1 && (
          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
