/**
 * Pace design tokens.
 *
 * Everything visual lives here so screens never hard-code a colour, size or
 * radius. Two palettes (light/dark) share the same keys, which lets the theme
 * hook hand back a single typed object.
 *
 * The accent is a warm terracotta. `accent` is the version that is readable on
 * the app background and carries white text at a 4.5:1 ratio or better,
 * `accentHover` is one step darker for the web hover state, and `accentSoft`
 * is the tinted surface used for active states and highlights. Small text on
 * `accentSoft` uses `text`, not `accent`, so the tint never lowers contrast.
 */

import { Platform } from 'react-native';

// Web-only global styles (font smoothing, full-height root). Expo's Metro
// config resolves this on web and ignores it on native.
import '@/global.css';

export type ColorSchemeName = 'light' | 'dark';

const light = {
  background: '#FBF8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F0EA',
  surfaceSunken: '#EDE8E0',
  border: '#E8E2D8',
  borderStrong: '#D8D0C2',
  text: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#78716C',
  // #C4472E: 4.63:1 on the paper background and 4.90:1 behind white text.
  accent: '#C4472E',
  accentHover: '#AC3B25',
  accentText: '#FFFFFF',
  accentSoft: '#FBE9E4',
  accentBorder: '#F0C4B8',
  danger: '#C0392B',
  dangerSoft: '#FDECEA',
  warning: '#B45309',
  priority: {
    1: '#D9593D',
    2: '#E8833A',
    3: '#3B82F6',
    4: '#A8A29E',
  },
  overlay: 'rgba(28, 25, 23, 0.4)',
  knob: '#FFFFFF',
} as const;

const dark = {
  background: '#1C1917',
  surface: '#262320',
  surfaceMuted: '#2F2B27',
  surfaceSunken: '#171412',
  border: '#3A3530',
  borderStrong: '#4A443E',
  text: '#F5F1EA',
  textSecondary: '#C4BDB3',
  textTertiary: '#9C958A',
  accent: '#E87A5F',
  accentHover: '#F0927B',
  accentText: '#1C1917',
  accentSoft: '#3A2620',
  accentBorder: '#5A3A32',
  danger: '#F08A80',
  dangerSoft: '#3A201E',
  warning: '#E8B173',
  priority: {
    1: '#E87A5F',
    2: '#EFA13C',
    3: '#6D9DF0',
    4: '#9C958A',
  },
  overlay: 'rgba(0, 0, 0, 0.6)',
  knob: '#F5F1EA',
} as const;

export const Colors = { light, dark };

export type AppColors = typeof light;

/** Spacing scale (4pt grid). */
export const Space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

/** Corner radii. */
export const Radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const Layout = {
  /** Content stops growing past this width, which keeps lines readable. */
  contentMaxWidth: 720,
  sidebarWidth: 264,
  /** Below this window width we use bottom tabs, above it a sidebar. */
  wideBreakpoint: 900,
  tabBarHeight: 58,
  /** Minimum tap target on every interactive element. */
  minTapTarget: 44,
} as const;

/**
 * Motion durations in milliseconds. Nothing in the app animates for longer than
 * 250ms; anything longer starts to feel like waiting. Screens skip these when
 * the person has asked for less motion (see `useReducedMotion`).
 */
export const Motion = {
  fast: 120,
  base: 180,
  slow: 240,
} as const;

/** System font stack, with Inter first on web when the user has it installed. */
export const FontFamily = Platform.select({
  web: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

/** Serif stack for journal body and large page titles (personality font). */
export const FontSerif = Platform.select({
  web: '"Lora", "Source Serif 4", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
  default: 'Lora_400Regular',
});

/** Monospace stack for code snippets (setup instructions). */
export const MonoFamily = Platform.select({
  web: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  ios: 'Menlo',
  default: 'monospace',
});

/**
 * Type scale. Kept deliberately small: one display size, one title, one
 * heading, body, small and caption. Letter spacing tightens as size grows.
 */
export const Type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600', letterSpacing: 0 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  smallStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0 },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
} as const;

export type TypeVariant = keyof typeof Type;
