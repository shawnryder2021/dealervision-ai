import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Wand2,
  ArrowRight,
  ArrowLeft,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ARTICLES,
  getArticle,
  getRelatedArticles,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/articles";
import type { Metadata } from "next";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} — DealerAdGen AI`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  const related = getRelatedArticles(slug, 3);

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

      {/* Article */}
      <article className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Resources
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Badge
                className={`${CATEGORY_COLORS[article.category]}`}
              >
                {CATEGORY_LABELS[article.category]}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime}
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
              {article.title}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {article.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-b border-border/50 py-4">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Hero emoji */}
          <div className="flex items-center justify-center py-12 mb-10 rounded-2xl bg-primary/5">
            <span className="text-[120px] leading-none">{article.heroEmoji}</span>
          </div>

          {/* Table of contents */}
          <div className="glass rounded-xl p-6 mb-10">
            <h2 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              In This Article
            </h2>
            <ol className="space-y-2">
              {article.sections.map((section, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <span className="text-xs font-mono text-primary/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* Content sections */}
          <div className="space-y-12">
            {article.sections.map((section, i) => (
              <section key={i} id={`section-${i}`} className="scroll-mt-24">
                <h2 className="font-heading text-2xl font-bold mb-4 flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-mono font-bold shrink-0">
                    {i + 1}
                  </span>
                  {section.heading}
                </h2>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  {section.content}
                </p>

                {section.tips && section.tips.length > 0 && (
                  <div className="glass rounded-xl p-5 mt-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Key Tips
                    </h3>
                    <ul className="space-y-2.5">
                      {section.tips.map((tip, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Article CTA */}
          <div className="mt-16 glass rounded-2xl p-8 text-center">
            <h2 className="font-heading text-2xl font-bold mb-2">
              {article.cta.text}
            </h2>
            <p className="text-muted-foreground mb-6">
              {article.cta.description}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button className="gradient-primary text-white px-8">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard?demo">
                <Button variant="outline">Try Demo</Button>
              </Link>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Tags:</span>
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="px-6 pb-20 border-t border-border/50 pt-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-center mb-8">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link key={rel.slug} href={`/resources/${rel.slug}`}>
                  <Card className="glass glass-hover transition-all hover:scale-[1.02] h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{rel.heroEmoji}</span>
                        <Badge
                          className={`text-[10px] ${CATEGORY_COLORS[rel.category]}`}
                        >
                          {CATEGORY_LABELS[rel.category]}
                        </Badge>
                      </div>
                      <h3 className="font-heading font-semibold text-sm mb-2 leading-snug">
                        {rel.title}
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed flex-1">
                        {rel.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium mt-3 pt-3 border-t border-border/50">
                        Read article
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
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
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} DealerAdGen AI. All rights reserved.
            </p>
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
