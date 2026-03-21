"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTENT_TYPES, CHANNEL_PRESETS } from "@/lib/constants";

interface AssetFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  contentType: string;
  onContentTypeChange: (value: string) => void;
  channel: string;
  onChannelChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function AssetFilters({
  search,
  onSearchChange,
  contentType,
  onContentTypeChange,
  channel,
  onChannelChange,
  sortBy,
  onSortByChange,
}: AssetFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={contentType} onValueChange={(v) => onContentTypeChange(v ?? "all")}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Content Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {CONTENT_TYPES.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={channel} onValueChange={(v) => onChannelChange(v ?? "all")}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Channels</SelectItem>
          {CHANNEL_PRESETS.map((ch) => (
            <SelectItem key={ch.id} value={ch.id}>
              {ch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={(v) => onSortByChange(v ?? "newest")}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="favorites">Favorites</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
