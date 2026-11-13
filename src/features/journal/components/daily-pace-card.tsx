import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export type DailyPaceCardHandle = {
  capture: () => Promise<string | null>;
};

type Props = {
  dateLabel: string;
  habitsDone: number;
  habitsTotal: number;
  tasksDone: number;
  tasksTotal: number;
  line: string;
};

const W = 1080;
const H = 1920;

const TERRACOTTA = '#C4472E';
const INK = '#1C1917';
const MUTED = '#8A7F75';
const TRACK = '#E8E1D6';

/**
 * A shareable 1080×1920 summary of the day. Rendered off-screen and captured
 * to a PNG via the SVG's `toDataURL`, so no extra native module is needed.
 */
export const DailyPaceCard = forwardRef<DailyPaceCardHandle, Props>(function DailyPaceCard(
  { dateLabel, habitsDone, habitsTotal, tasksDone, tasksTotal, line },
  ref,
) {
  const svgRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    capture: () =>
      new Promise<string | null>((resolve) => {
        const node = svgRef.current;
        if (!node || typeof node.toDataURL !== 'function') {
          resolve(null);
          return;
        }
        try {
          node.toDataURL((data: string) => resolve(data ?? null));
        } catch {
          resolve(null);
        }
      }),
  }));

  const total = habitsTotal + tasksTotal;
  const done = habitsDone + tasksDone;
  const ratio = total > 0 ? done / total : 0;

  const cx = W / 2;
  const cy = 760;
  const r = 260;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - ratio);

  const cardLine = line.trim().length > 0 ? line.trim().slice(0, 72) : 'A quiet day, written down.';

  return (
    <View style={{ width: W, height: H }} collapsable={false}>
      <Svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <SvgText
          x={cx}
          y={130}
          fontSize={44}
          fontWeight="600"
          fill={TERRACOTTA}
          textAnchor="middle">
          Pace
        </SvgText>
        <SvgText x={cx} y={190} fontSize={30} fill={MUTED} textAnchor="middle">
          {dateLabel}
        </SvgText>

        {/* Track */}
        <Circle cx={cx} cy={cy} r={r} stroke={TRACK} strokeWidth={18} fill="none" />
        {/* Progress */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={TERRACOTTA}
          strokeWidth={18}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        <SvgText x={cx} y={cy - 10} fontSize={150} fontWeight="700" fill={INK} textAnchor="middle">
          {done}
        </SvgText>
        <SvgText x={cx} y={cy + 50} fontSize={34} fill={MUTED} textAnchor="middle">
          of {total} done
        </SvgText>

        <SvgText x={cx} y={1100} fontSize={34} fill={INK} textAnchor="middle">
          Habits {habitsDone}/{habitsTotal} · Tasks {tasksDone}/{tasksTotal}
        </SvgText>

        <SvgText x={cx} y={1240} fontSize={30} fill={MUTED} textAnchor="middle" fontStyle="italic">
          {cardLine}
        </SvgText>

        <SvgText x={cx} y={1780} fontSize={26} fill={MUTED} textAnchor="middle">
          Find your daily pace.
        </SvgText>
      </Svg>
    </View>
  );
});
