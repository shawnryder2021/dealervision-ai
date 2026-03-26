"use client";

import { Wand2 } from "lucide-react";
import { ContentTypeSelector } from "@/components/create/ContentTypeSelector";
import { TemplateGallery } from "@/components/create/TemplateGallery";
import { SeasonalSuggestions } from "@/components/dashboard/SeasonalSuggestions";

export default function CreatePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          Create Marketing Visual
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a content type, use a template, or pick a seasonal suggestion
        </p>
      </div>

      {/* Seasonal Suggestions */}
      <SeasonalSuggestions />

      {/* Templates */}
      <TemplateGallery />

      {/* Content Types */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">
          All Content Types
        </h2>
        <ContentTypeSelector />
      </div>
    </div>
  );
}
