import type { Dealership, Vehicle } from "@/lib/types";
import type { CanvasElement } from "./types";
import { newId } from "./types";
import { STATE_DISCLAIMERS } from "@/lib/state-disclaimers";

interface PresetCtx {
  dealership: Dealership | null;
  vehicle: Vehicle | null;
  cx: number; // center x to drop the group at (canvas coords)
  cy: number;
}

export interface BadgePreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  build: (ctx: PresetCtx) => CanvasElement[];
}

function brand(dealership: Dealership | null) {
  return {
    primary: dealership?.brand_colors?.primary || "#003366",
    secondary: dealership?.brand_colors?.secondary || "#FFFFFF",
    accent: dealership?.brand_colors?.accent || "#FF8C00",
  };
}

export const BADGE_PRESETS: BadgePreset[] = [
  {
    id: "price-tag",
    label: "Price Tag",
    emoji: "💲",
    description: "Big bold price callout",
    build: ({ dealership, cx, cy }) => {
      const { primary, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 220,
          y: cy - 90,
          width: 440,
          height: 180,
          rotation: 0,
          fill: primary,
          cornerRadius: 18,
          name: "Price tag bg",
        },
        {
          id: newId(),
          type: "text",
          text: "STARTING AT",
          x: cx - 200,
          y: cy - 70,
          width: 400,
          height: 28,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 22,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          letterSpacing: 4,
          name: "Price label",
        } as CanvasElement,
        {
          id: newId(),
          type: "text",
          text: "{{price}}",
          x: cx - 200,
          y: cy - 30,
          width: 400,
          height: 100,
          rotation: 0,
          fontFamily: "Bebas Neue",
          fontSize: 96,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          name: "Price",
        } as CanvasElement,
      ];
    },
  },
  {
    id: "just-arrived",
    label: "JUST ARRIVED",
    emoji: "🚗",
    description: "Rotated stamp",
    build: ({ dealership, cx, cy }) => {
      const { accent, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 200,
          y: cy - 50,
          width: 400,
          height: 100,
          rotation: -8,
          fill: accent,
          cornerRadius: 6,
        },
        {
          id: newId(),
          type: "text",
          text: "JUST ARRIVED",
          x: cx - 200,
          y: cy - 30,
          width: 400,
          height: 60,
          rotation: -8,
          fontFamily: "Bebas Neue",
          fontSize: 60,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          letterSpacing: 4,
        } as CanvasElement,
      ];
    },
  },
  {
    id: "price-reduced",
    label: "PRICE REDUCED",
    emoji: "💥",
    description: "Star burst",
    build: ({ dealership, cx, cy }) => {
      const { accent, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "star",
          x: cx,
          y: cy,
          width: 360,
          height: 360,
          rotation: 0,
          fill: accent,
          numPoints: 12,
          innerRadius: 0.78,
        },
        {
          id: newId(),
          type: "text",
          text: "PRICE\nDROP",
          x: cx - 130,
          y: cy - 70,
          width: 260,
          height: 140,
          rotation: 0,
          fontFamily: "Bebas Neue",
          fontSize: 64,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          lineHeight: 0.95,
        } as CanvasElement,
      ];
    },
  },
  {
    id: "apr-callout",
    label: "0% APR",
    emoji: "📉",
    description: "Financing callout",
    build: ({ dealership, cx, cy }) => {
      const { primary, accent, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 180,
          y: cy - 110,
          width: 360,
          height: 220,
          rotation: 0,
          fill: primary,
          cornerRadius: 16,
        },
        {
          id: newId(),
          type: "text",
          text: "0%",
          x: cx - 160,
          y: cy - 95,
          width: 320,
          height: 130,
          rotation: 0,
          fontFamily: "Bebas Neue",
          fontSize: 130,
          fontStyle: "bold",
          align: "center",
          fill: accent,
        } as CanvasElement,
        {
          id: newId(),
          type: "text",
          text: "APR FINANCING",
          x: cx - 160,
          y: cy + 50,
          width: 320,
          height: 40,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 22,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          letterSpacing: 3,
        } as CanvasElement,
      ];
    },
  },
  {
    id: "payment-box",
    label: "Payment Box",
    emoji: "💳",
    description: "$X DOWN / $X/MO",
    build: ({ dealership, cx, cy }) => {
      const { primary, secondary, accent } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 240,
          y: cy - 100,
          width: 480,
          height: 200,
          rotation: 0,
          fill: secondary,
          stroke: primary,
          strokeWidth: 6,
          cornerRadius: 14,
        },
        {
          id: newId(),
          type: "text",
          text: "$0 DOWN",
          x: cx - 220,
          y: cy - 80,
          width: 220,
          height: 80,
          rotation: 0,
          fontFamily: "Bebas Neue",
          fontSize: 56,
          fontStyle: "bold",
          align: "center",
          fill: primary,
        } as CanvasElement,
        {
          id: newId(),
          type: "text",
          text: "$299/mo",
          x: cx + 10,
          y: cy - 80,
          width: 220,
          height: 80,
          rotation: 0,
          fontFamily: "Bebas Neue",
          fontSize: 56,
          fontStyle: "bold",
          align: "center",
          fill: accent,
        } as CanvasElement,
        {
          id: newId(),
          type: "text",
          text: "On approved credit. See dealer for details.",
          x: cx - 220,
          y: cy + 20,
          width: 440,
          height: 30,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 14,
          fontStyle: "normal",
          align: "center",
          fill: "#666666",
        } as CanvasElement,
      ];
    },
  },
  {
    id: "stock-badge",
    label: "Stock # Badge",
    emoji: "🏷️",
    description: "Compact stock pill",
    build: ({ dealership, cx, cy }) => {
      const { primary, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 110,
          y: cy - 24,
          width: 220,
          height: 48,
          rotation: 0,
          fill: primary,
          cornerRadius: 24,
        },
        {
          id: newId(),
          type: "text",
          text: "STOCK {{stock_number}}",
          x: cx - 100,
          y: cy - 14,
          width: 200,
          height: 28,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 18,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          letterSpacing: 2,
        } as CanvasElement,
      ];
    },
  },
  {
    id: "cpo-ribbon",
    label: "CPO Ribbon",
    emoji: "🎖️",
    description: "Certified Pre-Owned",
    build: ({ dealership, cx, cy }) => {
      const { accent, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 280,
          y: cy - 30,
          width: 560,
          height: 60,
          rotation: 0,
          fill: accent,
        },
        {
          id: newId(),
          type: "text",
          text: "CERTIFIED PRE-OWNED",
          x: cx - 270,
          y: cy - 20,
          width: 540,
          height: 40,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 28,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          letterSpacing: 6,
        } as CanvasElement,
      ];
    },
  },
  {
    id: "disclaimer-footer",
    label: "Disclaimer Footer",
    emoji: "⚖️",
    description: "Auto state-specific",
    build: ({ dealership, cx, cy }) => {
      const stateCode = (dealership as (Dealership & { state_code?: string }) | null)?.state_code;
      const d = stateCode ? STATE_DISCLAIMERS[stateCode] : null;
      const text = d
        ? [d.price, d.apr, d.general].filter(Boolean).join(" ")
        : "Plus tax, title, license. Subject to credit approval. See dealer for complete details.";
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 500,
          y: cy - 30,
          width: 1000,
          height: 60,
          rotation: 0,
          fill: "#000000",
          opacity: 0.7,
        },
        {
          id: newId(),
          type: "text",
          text,
          x: cx - 480,
          y: cy - 18,
          width: 960,
          height: 40,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 14,
          fontStyle: "normal",
          align: "center",
          fill: "#FFFFFF",
        } as CanvasElement,
      ];
    },
  },
  {
    id: "dealer-lockup",
    label: "Dealer Lockup",
    emoji: "🏢",
    description: "Name + phone + website",
    build: ({ dealership, cx, cy }) => {
      const { primary, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 360,
          y: cy - 50,
          width: 720,
          height: 100,
          rotation: 0,
          fill: primary,
          cornerRadius: 8,
        },
        {
          id: newId(),
          type: "text",
          text: "{{dealer_name}}",
          x: cx - 340,
          y: cy - 40,
          width: 680,
          height: 40,
          rotation: 0,
          fontFamily: "Bebas Neue",
          fontSize: 36,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
        } as CanvasElement,
        {
          id: newId(),
          type: "text",
          text: "{{phone}} · {{website}}",
          x: cx - 340,
          y: cy + 5,
          width: 680,
          height: 30,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 18,
          fontStyle: "normal",
          align: "center",
          fill: secondary,
        } as CanvasElement,
      ];
    },
  },
  {
    id: "today-only",
    label: "TODAY ONLY",
    emoji: "⏰",
    description: "Diagonal urgency banner",
    build: ({ dealership, cx, cy }) => {
      const { primary, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 240,
          y: cy - 36,
          width: 480,
          height: 72,
          rotation: -12,
          fill: primary,
        },
        {
          id: newId(),
          type: "text",
          text: "★ TODAY ONLY ★",
          x: cx - 240,
          y: cy - 22,
          width: 480,
          height: 50,
          rotation: -12,
          fontFamily: "Bebas Neue",
          fontSize: 44,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          letterSpacing: 4,
        } as CanvasElement,
      ];
    },
  },
  {
    id: "five-star",
    label: "5-Star Reviews",
    emoji: "⭐",
    description: "Rating burst",
    build: ({ dealership, cx, cy }) => {
      const { accent, secondary } = brand(dealership);
      return [
        {
          id: newId(),
          type: "shape",
          shape: "rect",
          x: cx - 200,
          y: cy - 60,
          width: 400,
          height: 120,
          rotation: 0,
          fill: accent,
          cornerRadius: 16,
        },
        {
          id: newId(),
          type: "text",
          text: "★ ★ ★ ★ ★",
          x: cx - 180,
          y: cy - 50,
          width: 360,
          height: 50,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 40,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
        } as CanvasElement,
        {
          id: newId(),
          type: "text",
          text: "5-STAR DEALER",
          x: cx - 180,
          y: cy + 5,
          width: 360,
          height: 36,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 22,
          fontStyle: "bold",
          align: "center",
          fill: secondary,
          letterSpacing: 6,
        } as CanvasElement,
      ];
    },
  },
];
