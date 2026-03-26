import Link from "next/link";
import {
  Wand2,
  Car,
  Image,
  Zap,
  Palette,
  ArrowRight,
  Star,
  Sparkles,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wand2,
    title: "AI Image Generation",
    description:
      "Generate professional marketing visuals in seconds with Nano Banana 2 AI.",
  },
  {
    icon: Palette,
    title: "Brand Consistency",
    description:
      "Every visual automatically incorporates your dealership's brand colors and identity.",
  },
  {
    icon: Monitor,
    title: "Multi-Channel Ready",
    description:
      "Auto-optimized for Instagram, Facebook, X, print, email, and 10+ channels.",
  },
  {
    icon: Car,
    title: "Vehicle Inventory",
    description:
      "Add your inventory and instantly create spotlight posts, price drops, and more.",
  },
  {
    icon: Image,
    title: "Asset Library",
    description:
      "Organize, search, and reuse all your generated marketing visuals.",
  },
  {
    icon: Zap,
    title: "Smart Prompts",
    description:
      "AI-optimized prompt templates for every content type — no design skills needed.",
  },
];

const contentTypes = [
  "Vehicle Spotlight",
  "Sales Event Banners",
  "New Arrival Posts",
  "Price Drop Alerts",
  "Service Promos",
  "Financing Offers",
  "Holiday Greetings",
  "Testimonials",
  "Brand Posts",
  "Custom Designs",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
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
              <Button variant="ghost" size="sm">
                Resources
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gradient-primary text-white">
                Get Started
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Powered by AI Image Generation
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Create Stunning Dealership{" "}
            <span className="text-gradient">Marketing Visuals</span> in Seconds
          </h1>

          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            DealerAdGen AI empowers car dealerships to instantly generate
            professional marketing materials for social media, websites, print,
            and more — no design skills required.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="gradient-primary text-white text-base px-8"
              >
                Start Creating Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard?demo">
              <Button size="lg" variant="outline" className="text-base gradient-accent text-black font-semibold">
                Try Demo
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              No design skills needed
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Results in under 30 seconds
            </span>
          </div>
        </div>
      </section>

      {/* Content Types Ticker */}
      <section className="py-8 border-y border-border/50 overflow-hidden">
        <div className="flex gap-8 justify-center flex-wrap">
          {contentTypes.map((type, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-sm text-muted-foreground/60 font-medium"
            >
              {type}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold">
              Everything Your Dealership Needs
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              From vehicle spotlights to seasonal campaigns, generate
              professional marketing content tailored to your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="glass glass-hover transition-all hover:scale-[1.01]"
              >
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-3">
              Three simple steps to professional dealership marketing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Content Type",
                desc: "Select from vehicle spotlight, sales event, service promo, and more.",
              },
              {
                step: "02",
                title: "Customize Details",
                desc: "Add your headline, select a channel, pick a style — our AI builds the perfect prompt.",
              },
              {
                step: "03",
                title: "Generate & Download",
                desc: "Get a professional marketing visual in seconds. Download, refine, or regenerate.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-white font-heading font-bold text-sm mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-12">
            <h2 className="font-heading text-3xl font-bold mb-4">
              Ready to Transform Your Marketing?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join dealerships already using AI to create professional marketing
              visuals faster than ever.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="gradient-primary text-white text-base px-8"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded gradient-primary">
              <Wand2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium">DealerAdGen AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/resources" className="hover:text-foreground transition-colors">
              Resources
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Get Started
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DealerAdGen AI. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
