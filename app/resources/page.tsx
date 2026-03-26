import Link from "next/link";
import {
  Wand2,
  ArrowRight,
  BookOpen,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ARTICLES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type ArticleCategory,
} from "@/lib/articles";

export const metadata = {
  title: "Digital Marketing Tips for Car Dealerships — DealerAdGen AI",
  description:
    "Free guides, tips, and strategies to help car dealerships master social media, SEO, email marketing, and AI-powered content creation.",
};

const CATEGORIES: { id: ArticleCategory | "all"; label: string }[] = [
  { id: "all", label: "All Topics" },
  { id: "social-media", label: "Social Media" },
  { id: "seo", label: "SEO" },
  { id: "content-strategy", label: "Content Strategy" },
  { id: "email-marketing", label: "Email Marketing" },
  { id: "branding", label: "Branding" },
  { id: "advertising", label: "Advertising" },
  { id: "ai-marketing", label: "AI & Automation" },
  { id: "video", label: "Video" },
];

export default function ResourcesPage() {
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">
              DealerAdGen AI
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/resources">
              <Button variant="ghost" size="sm" className="text-primary font-medium">
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
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Free Marketing Resources
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Digital Marketing Tips for{" "}
            <span className="text-gradient">Car Dealerships</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Expert guides, strategies, and actionable tips to help your
            dealership attract more buyers, build your brand, and sell more
            vehicles through digital marketing.
          </p>
        </div>
      </section>

      {/* Category filters */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === "all"
                ? ARTICLES.length
                : ARTICLES.filter((a) => a.category === cat.id).length;
            return (
              <Badge
                key={cat.id}
                variant="secondary"
                className="cursor-default px-3 py-1.5 text-xs font-medium"
              >
                {cat.label}
                <span className="ml-1.5 opacity-50">{count}</span>
              </Badge>
            );
          })}
        </div>
      </section>

      {/* Featured article */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <Link href={`/resources/${featured.slug}`}>
            <Card className="glass glass-hover transition-all hover:scale-[1.005] overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="bg-primary/5 flex items-center justify-center p-12 min-h-[240px]">
                    <span className="text-8xl">{featured.heroEmoji}</span>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <Badge
                      className={`w-fit mb-3 ${CATEGORY_COLORS[featured.category]}`}
                    >
                      {CATEGORY_LABELS[featured.category]}
                    </Badge>
                    <h2 className="font-heading text-2xl font-bold mb-3 leading-tight">
                      {featured.title}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {featured.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {featured.readTime}
                      </span>
                      <span>{featured.author}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Article grid */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <Link key={article.slug} href={`/resources/${article.slug}`}>
                <Card className="glass glass-hover transition-all hover:scale-[1.02] h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{article.heroEmoji}</span>
                      <Badge
                        className={`text-[10px] ${CATEGORY_COLORS[article.category]}`}
                      >
                        {CATEGORY_LABELS[article.category]}
                      </Badge>
                    </div>
                    <h3 className="font-heading font-semibold text-base mb-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                      <span className="flex items-center gap-1 text-primary font-medium">
                        Read more
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-12">
            <h2 className="font-heading text-3xl font-bold mb-4">
              Put These Tips Into Action
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              DealerAdGen AI helps you create professional marketing visuals
              for every channel — social media, email, print, and web — in
              seconds.
            </p>
            <div className="flex items-center justify-center gap-4">
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
                <Button size="lg" variant="outline" className="text-base">
                  Try Demo
                </Button>
              </Link>
            </div>
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
            <Link
              href="/resources"
              className="hover:text-foreground transition-colors"
            >
              Resources
            </Link>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="hover:text-foreground transition-colors"
            >
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
