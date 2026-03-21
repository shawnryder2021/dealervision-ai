"use client";

import { Wand2 } from "lucide-react";
import { ContentTypeSelector } from "@/components/create/ContentTypeSelector";

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          Create Marketing Visual
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a content type to get started
        </p>
      </div>

      <ContentTypeSelector />
    </div>
  );
}
