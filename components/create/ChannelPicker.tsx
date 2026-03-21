"use client";

import {
  Instagram,
  Facebook,
  Twitter,
  Globe,
  FileText,
  Mail,
  MapPin,
  Youtube,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANNEL_PRESETS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Instagram,
  Facebook,
  Twitter,
  Globe,
  FileText,
  Mail,
  MapPin,
  Youtube,
  Monitor,
};

interface ChannelPickerProps {
  value: string;
  onChange: (channelId: string) => void;
}

export function ChannelPicker({ value, onChange }: ChannelPickerProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Select Channel</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CHANNEL_PRESETS.map((channel) => {
          const Icon = iconMap[channel.icon] || Globe;
          const isSelected = value === channel.id;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onChange(channel.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{channel.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    {channel.aspectRatio}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    {channel.resolution}
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
