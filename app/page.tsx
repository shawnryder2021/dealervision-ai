import type { Metadata } from "next";
import Link from "next/link";
import {
  Wand2,
  Car,
  Image,
  Zap,
  ArrowRight,
  Sparkles,
  Monitor,
  Clock,
  Camera,
  Layers,
  Shield,
  BarChart3,
  Smartphone,
  PenLine,
  Megaphone,
  Check,
  Rocket,
  ImageIcon,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateMetadata, pageMetadata } from "@/lib/seo/metadata";
import { faqSchema, generateJsonLd } from "@/lib/seo/schema";

export const metadata: Metadata = generateMetadata({
  title: pageMetadata.home.title,
  description: pageMetadata.home.description,
  openGraph: {
    type: "website",
    title: pageMetadata.home.title,
    description: pageMetadata.home.description,
    images: [
      {
        url: "https://dealeradgen.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "DealerAdGen AI - AI marketing built for car dealers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageMetadata.home.title,
    description: pageMetadata.home.description,
    images: ["https://dealeradgen.com/og-image.png"],
  },
});

/* ─── Data ──────────────────────────────────────────────────────────────────── */

const stats = [
  { value: "13", label: "Marketing channels" },
  { value: "11", label: "Content types" },
  { value: "35+", label: "Premium backdrops" },
  { value: "<10 min", label: "Per vehicle" },
];

const beforeAfter = [
  { label: "Parking lot", emoji: "📱", sublabel: "Phone snap" },
  { label: "Urban showroom", emoji: "🏙️", sublabel: "AI-generated" },
  { label: "Coastal drive", emoji: "🌊", sublabel: "AI-generated" },
  { label: "Mountain glass", emoji: "🏔️", sublabel: "AI-generated" },
];

const capabilities = [
  {
    icon: Camera,
    title: "8 Angles from One Photo",
    desc: "Snap one hero shot → get front, rear, side, 3/4, and detail angles in a premium showroom. Complete VDP photo set.",
  },
  {
    icon: Layers,
    title: "13 Channels, One Click",
    desc: "Instagram, Facebook, X, email headers, print flyers, YouTube thumbnails, billboards — all sized and formatted automatically.",
  },
  {
    icon: PenLine,
    title: "Design Studio",
    desc: "Add price badges, \"JUST ARRIVED\" stamps, dealer logos, QR codes, and custom text overlays. Save as reusable templates.",
  },
  {
    icon: Megaphone,
    title: "AI Copy Assistant",
    desc: "Generate on-brand headlines, descriptions, and social captions for every vehicle. Click to fill — no blank-page staring.",
  },
  {
    icon: Smartphone,
    title: "Mobile VIN Scanner",
    desc: "Point your phone at the VIN barcode. Auto-fills year, make, model, trim. Start generating in seconds from the lot.",
  },
  {
    icon: Shield,
    title: "Privacy & Branding",
    desc: "License plate auto-blur or dealer-branded inlay, state disclaimers, and your logo on every asset — handled automatically.",
  },
  {
    icon: Car,
    title: "Inventory Management",
    desc: "Import via CSV, URL scrape, or VIN scan. Track aging units. Generate marketing the moment a vehicle hits your lot.",
  },
  {
    icon: BarChart3,
    title: "Lead Capture Widgets",
    desc: "Embeddable AI chat, trade-in estimator, and test-drive booking widgets for your website — every lead tracked.",
  },
];

const faqData = [
  {
    question: "How does it work?",
    answer:
      "Add a vehicle (scan VIN, import CSV, or type it in), pick a content type and channel, and hit Generate. You get a professional marketing image in under a minute — branded to your dealership, sized for the channel, ready to post.",
  },
  {
    question: "Do I need design skills?",
    answer:
      "No. Every content type has AI-optimized prompts built in. For custom work, the Design Studio handles text, badges, and overlays with drag-and-drop — no Photoshop required.",
  },
  {
    question: "What channels and sizes are supported?",
    answer:
      "13 channels: Instagram post + story, Facebook post + cover, X post, LinkedIn, YouTube thumbnail, Google Business, email header, website hero, print flyer, print poster, and digital billboard. Each auto-sized to spec.",
  },
  {
    question: "Can I use my own photos?",
    answer:
      "Yes. Upload any vehicle photo and the AI will swap the background, enhance it, or overlay your marketing graphics. The original vehicle is preserved exactly — same color, wheels, trim.",
  },
  {
    question: "What's included in the free trial?",
    answer:
      "25 image credits with full access to every feature, content type, and channel. No credit card required. When you're ready, Pro is $249/month for unlimited generations.",
  },
  {
    question: "How is this different from Canva or generic AI tools?",
    answer:
      "DealerAdGen is built specifically for car dealers. Every prompt, template, badge, and workflow is automotive-first — VIN scanning, dealer license plates, inventory integration, lead capture. Generic tools don't know what a VDP is.",
  },
];

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const faqSchema_ = faqSchema(faqData);

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateJsonLd(faqSchema_) }}
      />

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">
              DealerAdGen AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/resources">
              <Button variant="ghost" size="sm">Resources</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gradient-primary text-white">
                Start Free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              AI marketing built for car dealers
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Stop losing deals to{" "}
            <span className="text-gradient">bad lot photos</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            One phone photo becomes 8 showroom-quality angles, social posts,
            email headers, and VDP-ready creative — branded to your store,
            in under 10 minutes. No photographer. No agency.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link href="/signup">
              <Button size="lg" className="gradient-primary text-white text-base px-8 h-12">
                Start free — 25 image credits
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard?demo">
              <Button size="lg" variant="outline" className="text-base h-12 border-accent text-accent hover:bg-accent/10">
                <Sparkles className="h-4 w-4 mr-2" />
                Try the live demo
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            No credit card required · Cancel anytime · $249/mo for unlimited
          </p>
        </div>
      </section>

      {/* ── Before / After strip ───────────────────────────────────────────── */}
      <section className="py-10 px-6 border-y border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
            One photo in → showroom-quality marketing out
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {beforeAfter.map((item, i) => (
              <div
                key={i}
                className={`rounded-xl border p-6 text-center transition-all ${
                  i === 0
                    ? "bg-muted/60 border-border"
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                <span className="text-3xl mb-2 block">{item.emoji}</span>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Replace these placeholders with your real before/after images for maximum impact
          </p>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-heading text-3xl sm:text-4xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold">
              From lot to launch in 3 steps
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              No training, no onboarding call. Your team can generate their first
              campaign in under 10 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                icon: Camera,
                title: "Capture",
                desc: "Scan a VIN with your phone camera or add a vehicle from your inventory. One hero photo is all you need.",
              },
              {
                step: "2",
                icon: Wand2,
                title: "Generate",
                desc: "Pick a content type, channel, and style. Hit Generate. Get 8 angles + multi-channel creative in one batch — up to 4 variations.",
              },
              {
                step: "3",
                icon: Megaphone,
                title: "Publish",
                desc: "Download, push to social, or open in the Design Studio to add badges and text. Every asset lands in your library, every lead is tracked.",
              },
            ].map((item) => (
              <Card key={item.step} className="glass relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white font-heading font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <item.icon className="h-5 w-5 text-primary" />
                    <h3 className="font-heading font-semibold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities grid ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold">
              Built for dealers, not generic SaaS
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Every feature is automotive-first. VIN scanning,
              dealer license plates, inventory aging — things Canva will never do.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {capabilities.map((cap) => (
              <Card key={cap.title} className="glass glass-hover transition-all hover:scale-[1.01]">
                <CardContent className="p-5">
                  <cap.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-heading font-semibold text-sm mb-1.5">{cap.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border/50 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">
            The old way vs. DealerAdGen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="rounded-xl border border-border bg-background p-6 space-y-3">
              <p className="font-heading font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-4">
                Without DealerAdGen
              </p>
              {[
                "2–4 hours per vehicle on photos + creative",
                "iPhone lot photos with parking-lot backgrounds",
                "Hire a photographer ($150–300 per shoot)",
                "Separate tools for photos, social, email, leads",
                "License plates visible — privacy risk",
                "Manually resize for every channel",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* With */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-3">
              <p className="font-heading font-semibold text-primary text-sm uppercase tracking-wider mb-4">
                With DealerAdGen
              </p>
              {[
                "Under 10 minutes per vehicle, end to end",
                "8 photoreal angles in premium showrooms",
                "Phone camera + AI — $249/month all-in",
                "One platform, one dashboard, one bill",
                "Auto-blur or branded plate inlay",
                "13 channels auto-sized in one click",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Inline Pricing ─────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold">
              Simple pricing. Start free.
            </h2>
            <p className="text-muted-foreground mt-3">
              No setup fees. No per-image charges. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Trial */}
            <Card className="flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="font-heading font-bold text-lg">Free Trial</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">Free</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    25 image credits, no card required
                  </p>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {["25 AI image generations", "All 13 channels", "All content types", "Design Studio access", "Inventory management"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-auto">
                  <Button variant="outline" className="w-full">
                    Start free trial <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="flex flex-col border-primary shadow-lg shadow-primary/10 ring-1 ring-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3">Recommended</Badge>
              </div>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="font-heading font-bold text-lg">Pro</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">$249</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unlimited image generation
                  </p>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {["Unlimited AI image generations", "Everything in Free Trial", "Batch generation", "Multi-angle gallery", "AI copy assist", "Priority support"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className="mt-auto">
                  <Button className="w-full gradient-primary text-white">
                    Get Pro <Rocket className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Social Proof (placeholder) ─────────────────────────────────────── */}
      <section className="py-12 px-6 border-t border-border/50 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Built for dealerships that move fast
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { metric: "65%", label: "Less production time per vehicle" },
              { metric: "8 angles", label: "From a single phone photo" },
              { metric: "10 min", label: "From lot to every channel" },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-heading text-2xl font-bold text-primary">{item.metric}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            {faqData.map((faq, i) => (
              <details key={i} className="group glass rounded-lg">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-heading font-semibold text-sm list-none">
                  {faq.question}
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed -mt-1">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="mailto:support@dealeradgen.com">
              <Button variant="outline" size="sm">
                More questions? Contact us <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-10 sm:p-12">
            <h2 className="font-heading text-3xl font-bold mb-3">
              Your inventory is aging. Your marketing shouldn&apos;t be.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              25 free images. No credit card. Generate your first campaign
              in under 10 minutes and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gradient-primary text-white text-base px-8 h-12">
                  Start free — 25 image credits
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="ghost" className="text-muted-foreground">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded gradient-primary">
                <Wand2 className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-medium">DealerAdGen AI</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/resources" className="hover:text-foreground transition-colors">Resources</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Get Started</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} DealerAdGen AI. All rights reserved.</p>
            <p>
              Developed by{" "}
              <Link
                href="https://shawnryder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Shawn Ryder Digital
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
