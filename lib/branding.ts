/**
 * Centralized branding configuration for DealerAdGen AI
 * Ensures consistent colors, typography, spacing, and visual identity across the platform
 */

// Color palette in OKLch color space (modern, perceptually uniform color model)
export const colors = {
  // Primary brand color - Electric blue
  primary: {
    light: "oklch(0.55 0.22 259.815)", // Used for main UI elements
    dark: "oklch(0.623 0.214 259.815)", // Used for darker contexts
    rgb: "#0066FF", // Hex equivalent for fallback
  },

  // Secondary/Accent color - Amber/gold
  accent: {
    light: "oklch(0.702 0.183 70.08)",
    rgb: "#FFA500", // Fallback
  },

  // Semantic colors
  success: {
    light: "#10B981",
    dark: "#059669",
  },
  warning: {
    light: "#F59E0B",
    dark: "#D97706",
  },
  error: {
    light: "#EF4444",
    dark: "#DC2626",
  },
  info: {
    light: "#3B82F6",
    dark: "#1D4ED8",
  },

  // Neutral grayscale
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
};

// Typography system
export const typography = {
  // Font families
  fonts: {
    heading: "'Outfit', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
    code: "'JetBrains Mono', 'Courier New', monospace",
  },

  // Font sizes (in rem, relative to 16px base)
  sizes: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },

  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// Spacing scale (used for padding, margin, gaps)
export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
};

// Border radius tokens
export const borderRadius = {
  none: "0",
  sm: "0.375rem", // 6px
  base: "0.625rem", // 10px - default
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  full: "9999px",
};

// Shadow tokens for elevation
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

// Gradient utilities
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary.light}, ${colors.accent.light})`,
  primaryToDark: `linear-gradient(135deg, ${colors.primary.light}, ${colors.primary.dark})`,
  accentGold: `linear-gradient(135deg, ${colors.accent.light}, #FFD700)`,
};

// Transitions and animations
export const transitions = {
  fast: "150ms ease-in-out",
  base: "200ms ease-in-out",
  slow: "300ms ease-in-out",
};

// Component-specific styles
export const components = {
  button: {
    borderRadius: borderRadius.md,
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    transition: transitions.base,
  },

  card: {
    borderRadius: borderRadius.lg,
    boxShadow: shadows.base,
    padding: spacing[6],
  },

  input: {
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    padding: `${spacing[2]} ${spacing[3]}`,
    transition: transitions.base,
  },

  badge: {
    borderRadius: borderRadius.full,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    padding: `${spacing[1]} ${spacing[2]}`,
  },
};

// Responsive breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Spacing constants for common layout patterns
export const layout = {
  maxWidth: "7xl",
  contentPadding: spacing[6],
  sidebarWidth: "14rem",
  headerHeight: "4rem",
  footerHeight: "auto",
};

// Zindex hierarchy
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  backdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 9999,
};
