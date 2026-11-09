/**
 * Pace design tokens.
 *
 * Everything visual lives here so screens never hard-code a colour, size or
 * radius. Two palettes (light/dark) share the same keys, which lets the theme
 * hook hand back a single typed object.
 *
 * The accent is a soft sage green. `accent` is the version that is readable on
 * the app background (contrast >= 4.5:1), `accentSoft` is the tinted surface
 * used for active states and highlights.
 */

import { Platform } from 'react-native';

// Web-only global styles (font smoothing, full-height root). Expo's Metro
// config resolves this on web and ignores it on native.
import '@/global.css';

export type ColorSchemeName = 'light' | 'dark';

const light = {
  background: '#FBFBF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F3EE',
  surfaceSunken: '#EFEFE9',
  border: '#E7E7DF',
  borderStrong: '#D3D3C9',
  text: '#1D1D1A',
  textSecondary: '#5F5F58',
  textTertiary: '#7C7C73',
  accent: '#52704F',
  accentText: '#FFFFFF',
  accentSoft: '#E9F0E6',
  accentBorder: '#C8D8C2',
  danger: '#B3382F',
  dangerSoft: '#FBEDEB',
  warning: '#9A5B0B',
  priority: {
    1: '#D1453B',
    2: '#EB8909',
    3: '#2F6FE0',
    4: '#8F8F86',
  },
  overlay: 'rgba(24, 24, 21, 0.4)',
  knob: '#FFFFFF',
} as const;

const dark = {
  background: '#121211',
  surface: '#1A1A18',
  surfaceMuted: '#222220',
  surfaceSunken: '#171715',
  border: '#2C2C28',
  borderStrong: '#3E3E38',
  text: '#ECECE5',
  textSecondary: '#A8A89F',
  textTertiary: '#83837A',
  accent: '#A2C099',
  accentText: '#14180F',
  accentSoft: '#212A1F',
  accentBorder: '#374633',
  danger: '#E88A80',
  dangerSoft: '#2A1B19',
  warning: '#E8B173',
  priority: {
    1: '#E86A5F',
    2: '#EFA13C',
    3: '#6D9DF0',
    4: '#8F8F86',
  },
  overlay: 'rgba(0, 0, 0, 0.6)',
  knob: '#ECECE5',
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
  xl: 20,
  xxl: 28,
  xxxl: 40,
  huge: 56,
} as const;

/** Corner radii. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
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

/** System font stack, with Inter first on web when the user has it installed. */
export const FontFamily = Platform.select({
  web: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
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
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.9 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 25, fontWeight: '400', letterSpacing: -0.1 },
  bodyStrong: { fontSize: 16, lineHeight: 25, fontWeight: '600', letterSpacing: -0.1 },
  small: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  smallStrong: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
} as const;

export type TypeVariant = keyof typeof Type;
