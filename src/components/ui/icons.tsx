/**
 * Hand-drawn 24×24 line icons (Feather-style geometry) rendered with
 * react-native-svg. Using SVG instead of an icon font keeps them crisp on
 * every platform — including web — and avoids shipping a font file.
 *
 * Every icon takes an explicit colour so callers stay theme-aware.
 */

import type { ReactNode } from 'react';
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

/** Brand mark: a single leaf, used in the sidebar and the setup screen. */
export function LeafIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <Path d="M20.5 3.5c0 9.4-6.6 16-16 16 0-9.4 6.6-16 16-16Z" />
      <Path d="M4.5 19.5C7.4 14.6 10.9 11.1 15.8 8.2" />
    </SvgIcon>
  );
}
