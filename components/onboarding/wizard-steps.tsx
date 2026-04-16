"use client";

import { useState } from "react";
import { Mail, Lock, User, Building2, Palette, FileText, ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface WizardFormData {
  // Account & Dealership
  fullName: string;
  dealershipName: string;
  email: string;
  password: string;
  // Brand
  brandVoice: "luxury" | "friendly" | "sporty" | "professional" | "";
  primaryColor: string;
  secondaryColor: string;
  // Inventory
  inventoryType: "new" | "used" | "both" | "";
}

interface WizardStepsProps {
  data: WizardFormData;
  onChange: (data: Partial<WizardFormData>) => void;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  error?: string;
}

export function Step1AccountDealership({ data, onChange, onNext, isLoading, error }: Omit<WizardStepsProps, "currentStep" | "onPrev">) {
  const isValid = data.fullName && data.dealershipName && data.email && data.password && data.password.length >= 8;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold mb-1">Create Your Account</h2>
        <p className="text-sm text-muted-foreground">Step 1 of 4 — Basic account information</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:bg-red-900/10 dark:border-red-800 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              placeholder="John Smith"
              value={data.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealershipName">Dealership Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="dealershipName"
              placeholder="Your Dealership Name"
              value={data.dealershipName}
              onChange={(e) => onChange({ dealershipName: e.target.value })}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@dealership.com"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={data.password}
              onChange={(e) => onChange({ password: e.target.value })}
              className="pl-9"
              minLength={8}
              disabled={isLoading}
            />
          </div>
          {data.password && data.password.length < 8 && (
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
          )}
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid || isLoading}
        className="w-full gradient-primary text-white"
      >
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
        Continue
      </Button>
    </div>
  );
}

export function Step2BrandIdentity({ data, onChange, onNext, onPrev, isLoading }: WizardStepsProps) {
  const voiceOptions: Array<{ value: WizardFormData["brandVoice"]; label: string; description: string }> = [
    { value: "luxury", label: "Luxury", description: "Premium, exclusive, high-end" },
    { value: "friendly", label: "Friendly", description: "Warm, approachable, welcoming" },
    { value: "sporty", label: "Sporty", description: "Dynamic, energetic, performance-focused" },
    { value: "professional", label: "Professional", description: "Trustworthy, reliable, business-focused" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold mb-1">Brand Identity</h2>
        <p className="text-sm text-muted-foreground">Step 2 of 4 — Customize your brand appearance</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Brand Voice</Label>
          <div className="grid grid-cols-2 gap-3">
            {voiceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange({ brandVoice: option.value })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  data.brandVoice === option.value
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-primary/50"
                }`}
                disabled={isLoading}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Brand Color</Label>
          <div className="flex gap-2">
            <Input
              id="primaryColor"
              type="color"
              value={data.primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="h-10 w-14 p-1 cursor-pointer"
              disabled={isLoading}
            />
            <div className="flex-1">
              <Input
                type="text"
                placeholder="#0066FF"
                value={data.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
          <div className="flex gap-2">
            <Input
              id="secondaryColor"
              type="color"
              value={data.secondaryColor}
              onChange={(e) => onChange({ secondaryColor: e.target.value })}
              className="h-10 w-14 p-1 cursor-pointer"
              disabled={isLoading}
            />
            <div className="flex-1">
              <Input
                type="text"
                placeholder="#FF6600"
                value={data.secondaryColor}
                onChange={(e) => onChange({ secondaryColor: e.target.value })}
                className="font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {data.primaryColor && data.secondaryColor && (
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
            <div className="flex gap-2">
              <div
                className="h-8 w-16 rounded"
                style={{ backgroundColor: data.primaryColor }}
              />
              <div
                className="h-8 w-16 rounded"
                style={{ backgroundColor: data.secondaryColor }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onPrev} variant="outline" disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1 gradient-primary text-white" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
          Continue
        </Button>
      </div>
    </div>
  );
}

export function Step3Inventory({ data, onChange, onNext, onPrev, isLoading }: WizardStepsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold mb-1">Inventory Setup</h2>
        <p className="text-sm text-muted-foreground">Step 3 of 4 — Configure your inventory type</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inventoryType">What type of vehicles do you sell?</Label>
          <Select
            value={data.inventoryType}
            onValueChange={(value) => onChange({ inventoryType: value as any })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select inventory type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Vehicles Only</SelectItem>
              <SelectItem value="used">Used Vehicles Only</SelectItem>
              <SelectItem value="both">New & Used Vehicles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-muted/50 border-0">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-3">
              <div className="text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Import Vehicles Later</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can import your vehicle inventory via CSV file after onboarding completes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={onPrev} variant="outline" disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1 gradient-primary text-white" disabled={!data.inventoryType || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
          Continue
        </Button>
      </div>
    </div>
  );
}

export function Step4Complete({ onComplete, isLoading }: { onComplete: () => void; isLoading: boolean }) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-bold mb-2">You're All Set!</h2>
        <p className="text-sm text-muted-foreground">
          Your account is ready. Let's create your first marketing visual.
        </p>
      </div>

      <Card className="bg-muted/50 border-0">
        <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground text-left">
          <p>✓ Account created with your brand identity</p>
          <p>✓ Ready to start creating marketing content</p>
          <p>✓ Can import vehicles anytime from the inventory page</p>
        </CardContent>
      </Card>

      <Button onClick={onComplete} className="w-full gradient-primary text-white" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
        Go to Dashboard
      </Button>
    </div>
  );
}
