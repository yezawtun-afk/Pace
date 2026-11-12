/**
 * Hand-drawn 24×24 line icons (Feather-style geometry) rendered with
 * react-native-svg. Using SVG instead of an icon font keeps them crisp on
 * every platform — including web — and avoids shipping a font file.
 *
 * Every icon takes an explicit colour so callers stay theme-aware.
 */

import type { ComponentType, ReactNode } from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color: string;
  strokeWidth?: number;
};

type SvgIconProps = IconProps & { children: ReactNode };

function SvgIcon({ size = 22, color, strokeWidth = 1.7, children }: SvgIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Circle cx="12" cy="12" r="4.2" />
      <Line x1="12" y1="2.5" x2="12" y2="4.5" />
      <Line x1="12" y1="19.5" x2="12" y2="21.5" />
      <Line x1="2.5" y1="12" x2="4.5" y2="12" />
      <Line x1="19.5" y1="12" x2="21.5" y2="12" />
      <Line x1="5.2" y1="5.2" x2="6.6" y2="6.6" />
      <Line x1="17.4" y1="17.4" x2="18.8" y2="18.8" />
      <Line x1="5.2" y1="18.8" x2="6.6" y2="17.4" />
      <Line x1="17.4" y1="6.6" x2="18.8" y2="5.2" />
    </SvgIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M20.5 14.3A8.7 8.7 0 0 1 9.7 3.5a8.7 8.7 0 1 0 10.8 10.8Z" />
    </SvgIcon>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Rect x="3" y="4" width="18" height="12.5" rx="2" />
      <Line x1="8.5" y1="20.5" x2="15.5" y2="20.5" />
      <Line x1="12" y1="16.5" x2="12" y2="20.5" />
    </SvgIcon>
  );
}

export function TodayIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Rect x="3.2" y="4.6" width="17.6" height="16.2" rx="3" />
      <Line x1="3.2" y1="9.6" x2="20.8" y2="9.6" />
      <Line x1="8" y1="2.8" x2="8" y2="6" />
      <Line x1="16" y1="2.8" x2="16" y2="6" />
      <Circle cx="12" cy="15" r="1.6" />
    </SvgIcon>
  );
}

export function HabitsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Polyline points="17 2.5 20.5 6 17 9.5" />
      <Path d="M3.5 11.2V9.7A3.7 3.7 0 0 1 7.2 6h13.3" />
      <Polyline points="7 21.5 3.5 18 7 14.5" />
      <Path d="M20.5 12.8v1.5a3.7 3.7 0 0 1-3.7 3.7H3.5" />
    </SvgIcon>
  );
}

export function JournalIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M2.8 3.5h5.7A3.5 3.5 0 0 1 12 7v13.5a2.8 2.8 0 0 0-2.8-2.8H2.8Z" />
      <Path d="M21.2 3.5h-5.7A3.5 3.5 0 0 0 12 7v13.5a2.8 2.8 0 0 1 2.8-2.8h6.4Z" />
    </SvgIcon>
  );
}

export function TasksIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Polyline points="8.8 11.4 11.4 14 21 4.6" />
      <Path d="M20 12.4v6.1a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 18.5V6.4A2.4 2.4 0 0 1 5.4 4h10.9" />
    </SvgIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Line x1="5" y1="21" x2="5" y2="14" />
      <Line x1="5" y1="10" x2="5" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12" y2="3" />
      <Line x1="19" y1="21" x2="19" y2="16" />
      <Line x1="19" y1="12" x2="19" y2="3" />
      <Circle cx="5" cy="12" r="2" />
      <Circle cx="12" cy="10" r="2" />
      <Circle cx="19" cy="14" r="2" />
    </SvgIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </SvgIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Polyline points="20 6.5 9.5 17 4 11.5" />
    </SvgIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Polyline points="9 18 15 12 9 6" />
    </SvgIcon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Polyline points="15 18 9 12 15 6" />
    </SvgIcon>
  );
}

/** Small flame used next to streaks. */
export function FlameIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M12 3.2c2.7 3 4.4 5.1 4.4 7.4a4.4 4.4 0 0 1-8.8 0c0-1.2.4-2.2 1.2-3.3.3 1 .9 1.7 1.7 2 .2-2.2.6-4 1.5-6.1Z" />
      <Path d="M12 20.8c-2.9 0-5.2-1.9-5.2-4.6 0-1.6.8-3.1 2.2-4.6" />
      <Path d="M12 20.8c2.9 0 5.2-1.9 5.2-4.6 0-1.6-.8-3.1-2.2-4.6" />
    </SvgIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </SvgIcon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M12 3.2 13.9 8.1 18.8 10 13.9 11.9 12 16.8 10.1 11.9 5.2 10 10.1 8.1Z" />
      <Line x1="18.5" y1="16.5" x2="18.5" y2="20.5" />
      <Line x1="16.5" y1="18.5" x2="20.5" y2="18.5" />
    </SvgIcon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <Circle cx="12" cy="12" r="3" />
    </SvgIcon>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M2.5 12S6 5.5 12 5.5c1.6 0 3 .5 4.2 1.2M21.5 12S18 18.5 12 18.5c-1.6 0-3-.5-4.2-1.2" />
      <Circle cx="12" cy="12" r="3" />
      <Line x1="4" y1="20" x2="20" y2="4" />
    </SvgIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Circle cx="11" cy="11" r="6.5" />
      <Line x1="16" y1="16" x2="20.5" y2="20.5" />
    </SvgIcon>
  );
}

/** A small photo frame, used wherever a proof photo is attached. */
export function ImageIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <Circle cx="8.5" cy="9.5" r="1.6" />
      <Path d="M3.5 16.5 9 11.5l4 3.5 3-2.5 4.5 3.5" />
    </SvgIcon>
  );
}

/** Used by the swipe action on a task row. */
export function TrashIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
      <Path d="M18.5 6.5 17.6 19a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5.5 6.5" />
      <Line x1="9.5" y1="3.5" x2="14.5" y2="3.5" />
      <Line x1="10" y1="10.5" x2="10" y2="16.5" />
      <Line x1="14" y1="10.5" x2="14" y2="16.5" />
    </SvgIcon>
  );
}

/** Brand mark: a single leaf, used in the sidebar and the setup screen. */
export function LeafIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M20.5 3.5c0 9.4-6.6 16-16 16 0-9.4 6.6-16 16-16Z" />
      <Path d="M4.5 19.5C7.4 14.6 10.9 11.1 15.8 8.2" />
    </SvgIcon>
  );
}

/* --------------------------------------------------------------------------
 * Habit glyphs.
 *
 * Habits used to be stored as an emoji. Emoji render differently on every
 * device (and read as decoration rather than interface), so the editor now
 * picks one of these line glyphs. `HabitGlyph` is the one place that maps a
 * stored value to a drawing, which keeps old emoji rows working.
 * ------------------------------------------------------------------------ */

export function WalkIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Circle cx="13" cy="4.6" r="2" />
      <Line x1="13" y1="6.6" x2="11.5" y2="13" />
      <Line x1="11.5" y1="13" x2="8.5" y2="20" />
      <Line x1="11.5" y1="13" x2="15" y2="20" />
      <Line x1="12.8" y1="8.6" x2="16.6" y2="10.6" />
      <Line x1="12.4" y1="10.4" x2="8.6" y2="12.4" />
    </SvgIcon>
  );
}

export function RunIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Circle cx="15" cy="4.6" r="2" />
      <Line x1="15" y1="6.6" x2="11.5" y2="12" />
      <Line x1="11.5" y1="12" x2="7.5" y2="16.5" />
      <Line x1="11.5" y1="12" x2="15.5" y2="16" />
      <Line x1="13.6" y1="8.4" x2="18" y2="9.4" />
      <Line x1="12.8" y1="10.4" x2="17" y2="12.6" />
    </SvgIcon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </SvgIcon>
  );
}

export function DropletIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M12 3.2 6.9 9.8a7 7 0 1 0 10.2 0L12 3.2Z" />
    </SvgIcon>
  );
}

export function BasketIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Rect x="5" y="9" width="14" height="11.5" rx="2" />
      <Path d="M8.6 9V7a3.4 3.4 0 0 1 6.8 0v2" />
      <Line x1="9.2" y1="12.6" x2="9.2" y2="16.6" />
      <Line x1="12" y1="12.6" x2="12" y2="16.6" />
      <Line x1="14.8" y1="12.6" x2="14.8" y2="16.6" />
    </SvgIcon>
  );
}

export function StillIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Circle cx="12" cy="6.4" r="2" />
      <Path d="M8.4 18c0-3.4 1.6-5.2 3.6-5.2s3.6 1.8 3.6 5.2" />
      <Line x1="4.8" y1="18" x2="19.2" y2="18" />
    </SvgIcon>
  );
}

export function MusicIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M9 17.5V5l11-2v12.5" />
      <Circle cx="6.5" cy="17.5" r="2.5" />
      <Circle cx="17.5" cy="15.5" r="2.5" />
    </SvgIcon>
  );
}

export function PenIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M16.6 3.4a2.6 2.6 0 0 1 3.7 3.7L7.8 19.6 3 21l1.4-4.8Z" />
      <Line x1="14.6" y1="5.4" x2="18.3" y2="9.1" />
    </SvgIcon>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M12 8.6c-1.1-1.7-4-2.2-5.6-.2-1.9 2.6-.3 7.7 3.4 10.1.9.6 2 .6 2.9 0 3.7-2.4 5.3-7.5 3.4-10.1-1.6-2-4.5-1.5-5.6.2Z" />
      <Line x1="12" y1="8.6" x2="12" y2="5.6" />
      <Path d="M12 5.6c1.2 0 2.1-.9 2.1-2.1-1.2 0-2.1.9-2.1 2.1Z" />
    </SvgIcon>
  );
}

export function BikeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Circle cx="5.8" cy="17.2" r="3.4" />
      <Circle cx="18.2" cy="17.2" r="3.4" />
      <Path d="M5.8 17.2 9.4 9.6h4.8l3.9 7.6" />
      <Line x1="9.4" y1="9.6" x2="14.2" y2="9.6" />
    </SvgIcon>
  );
}

export function BroomIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Line x1="19.4" y1="4.4" x2="12.4" y2="11.8" />
      <Path d="M12.4 11.8 7.6 14.6l2.6 3.2 4.4-3.4" />
      <Line x1="8.8" y1="16.2" x2="7.6" y2="18.2" />
      <Line x1="10.8" y1="17.2" x2="9.9" y2="19.4" />
    </SvgIcon>
  );
}

export function BedIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M2.8 18.4V8.6" />
      <Path d="M21.2 18.4v-5.8" />
      <Line x1="2.8" y1="15.2" x2="21.2" y2="15.2" />
      <Path d="M6 15.2v-2.6A1.6 1.6 0 0 1 7.6 11h3.8a1.6 1.6 0 0 1 1.6 1.6v2.6" />
    </SvgIcon>
  );
}

export function BulbIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Line x1="9.2" y1="17.4" x2="14.8" y2="17.4" />
      <Line x1="10.2" y1="20.4" x2="13.8" y2="20.4" />
      <Path d="M12 3.4a5.9 5.9 0 0 0-3.4 10.7c.6.4.9 1 .9 1.7v1.6h5v-1.6c0-.7.3-1.3.9-1.7A5.9 5.9 0 0 0 12 3.4Z" />
    </SvgIcon>
  );
}

/**
 * Habit icon key → glyph. The keys double as the value stored in
 * `habits.icon`, so keeping the names stable matters: renaming one would turn
 * existing habits blank.
 */
const HABIT_GLYPHS: Record<string, ComponentType<IconProps>> = {
  leaf: LeafIcon,
  walk: WalkIcon,
  book: BookIcon,
  moon: MoonIcon,
  drop: DropletIcon,
  basket: BasketIcon,
  still: StillIcon,
  run: RunIcon,
  music: MusicIcon,
  pen: PenIcon,
  apple: AppleIcon,
  sun: SunIcon,
  bike: BikeIcon,
  broom: BroomIcon,
  rest: BedIcon,
  mind: BulbIcon,
};

/** Renders a habit glyph by key; unknown values fall back to the brand leaf. */
export function HabitGlyph({ name, ...props }: IconProps & { name: string }) {
  const Glyph = HABIT_GLYPHS[name] ?? LeafIcon;
  return <Glyph {...props} />;
}
