import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, TextLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import {
  CheckIcon,
  HabitGlyph,
  HabitsIcon,
  JournalIcon,
  LeafIcon,
  TasksIcon,
} from '@/components/ui/icons';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import {
  STARTER_HABITS,
  STARTER_HABIT_MAX,
  STARTER_HABIT_MIN,
  type StarterHabit,
} from '@/constants/starter-habits';
import { Radius, Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyDataError } from '@/features/auth/errors';
import { profileKeys } from '@/features/auth/keys';
import { useProfile } from '@/features/auth/use-profile';
import { completeOnboarding } from '@/features/onboarding/api';
import { detectTimeZone, shortTime, timeZoneLabel } from '@/lib/time';
import { queryClient } from '@/lib/query-client';
import { useTheme } from '@/lib/use-theme';

/** Offered in step 3. Morning reviews exist too, but the evening is the default. */
const EVENING_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00'];

const TOTAL_STEPS = 3;

/**
 * Three short steps: what Pace is, which habits to start with, and the small
 * details that make "today" mean the right day. Everything can be changed later,
 * so nothing here is a permanent decision.
 */
export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const profileQuery = useProfile();
  const profile = profileQuery.data;

  const [step, setStep] = useState(0);

  // Pre-filled from the profile the sign-up trigger created.
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [eveningTime, setEveningTime] = useState(
    shortTime(profile?.evening_review_time) || '20:00',
  );
  const [timezone] = useState(
    profile?.timezone && profile.timezone !== 'UTC' ? profile.timezone : detectTimeZone(),
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const atLimit = selected.length >= STARTER_HABIT_MAX;

  function toggleHabit(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= STARTER_HABIT_MAX) {
        return current;
      }
      return [...current, id];
    });
  }

  async function finish({ skipHabits = false } = {}) {
    if (saving || !session) return;

    setError(null);
    setSaving(true);

    const chosen: StarterHabit[] = skipHabits
      ? []
      : STARTER_HABITS.filter((habit) => selected.includes(habit.id));

    try {
      const updated = await completeOnboarding({
        userId: session.user.id,
        displayName,
        timezone,
        eveningReviewTime: eveningTime,
        habits: chosen.map((habit) => ({
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
        })),
      });

      // The guard in the root layout opens the app as soon as this flag is true,
      // so put the fresh row in the cache first — no refetch, no empty flash.
      queryClient.setQueryData(profileKeys.detail(session.user.id), updated);
    } catch (caught) {
      setError(friendlyDataError(caught));
      setSaving(false);
    }
  }

  const canContinue = selected.length >= STARTER_HABIT_MIN;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: Space.xl,
          paddingTop: insets.top + Space.xxl,
          paddingBottom: insets.bottom + Space.xxl,
        }}
        keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 460 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: Radius.md,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <LeafIcon size={21} color={colors.accentText} />
            </View>
            <AppText variant="heading">Pace</AppText>
          </View>

          <StepProgress step={step} />

          {step === 0 ? (
            <WelcomeStep />
          ) : step === 1 ? (
            <HabitStep
              selected={selected}
              atLimit={atLimit}
              onToggle={toggleHabit}
              onSkip={() => void finish({ skipHabits: true })}
              saving={saving}
            />
          ) : (
            <DetailsStep
              displayName={displayName}
              onChangeName={setDisplayName}
              timezone={timezone}
              eveningTime={eveningTime}
              onChangeEveningTime={setEveningTime}
              saving={saving}
              error={error}
            />
          )}

          <View style={{ marginTop: Space.xxl, gap: Space.md }}>
            {step === 0 ? (
              <>
                <Button label="Get started" onPress={() => setStep(1)} />
                <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                  Takes about a minute.
                </AppText>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Button
                  label="Continue"
                  onPress={() => {
                    setError(null);
                    setStep(2);
                  }}
                  disabled={!canContinue}
                />
                <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                  {canContinue
                    ? 'You can change any of these later.'
                    : 'Pick at least one habit to continue, or skip this step.'}
                </AppText>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Button label="Finish setup" onPress={() => void finish()} loading={saving} />
                <TextLink label="Back" align="center" onPress={() => setStep(1)} />
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Three thin bars: the filled ones show how far along the user is. */
function StepProgress({ step }: { step: number }) {
  const { colors } = useTheme();

  return (
    <View style={{ marginTop: Space.xxl, marginBottom: Space.xxl, gap: Space.sm }}>
      <AppText variant="overline" tone="tertiary">
        Step {step + 1} of {TOTAL_STEPS}
      </AppText>
      <View style={{ flexDirection: 'row', gap: Space.sm }} accessibilityElementsHidden>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 3,
              borderRadius: Radius.pill,
              backgroundColor: index <= step ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function WelcomeStep() {
  const { colors } = useTheme();

  return (
    <View>
      <AppText variant="title">Let&apos;s find your daily pace.</AppText>
      <AppText variant="small" tone="secondary" style={{ marginTop: Space.sm }}>
        Pace keeps the three things that make a day feel finished in one quiet place.
      </AppText>

      <Card style={{ marginTop: Space.xl, gap: Space.lg }}>
        <FeatureRow
          icon={<HabitsIcon size={18} color={colors.accent} />}
          title="Habits you want to keep"
          message="Small things repeated. A streak shows how steady you have been — not how good."
        />
        <FeatureRow
          icon={<TasksIcon size={18} color={colors.accent} />}
          title="Tasks for today"
          message="What actually has to happen today, and nothing else."
        />
        <FeatureRow
          icon={<JournalIcon size={18} color={colors.accent} />}
          title="A short evening review"
          message="Two minutes of writing at the end of the day, so it does not blur into the next."
          last
        />
      </Card>
    </View>
  );
}

function FeatureRow({
  icon,
  title,
  message,
  last,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  last?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: Space.md,
        paddingBottom: last ? 0 : Space.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: Radius.sm,
          backgroundColor: colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View style={{ flex: 1, gap: Space.xxs }}>
        <AppText variant="smallStrong">{title}</AppText>
        <AppText variant="small" tone="secondary">
          {message}
        </AppText>
      </View>
    </View>
  );
}

function HabitStep({
  selected,
  atLimit,
  onToggle,
  onSkip,
  saving,
}: {
  selected: string[];
  atLimit: boolean;
  onToggle: (id: string) => void;
  onSkip: () => void;
  saving: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View>
      <AppText variant="title">What would you like to keep up?</AppText>
      <AppText variant="small" tone="secondary" style={{ marginTop: Space.sm }}>
        Pick up to three to start with. You can add more later and change any of these.
      </AppText>

      <View style={{ marginTop: Space.xl, gap: Space.sm }}>
        {STARTER_HABITS.map((habit) => {
          const isSelected = selected.includes(habit.id);
          const isDisabled = atLimit && !isSelected;

          return (
            <Pressable
              key={habit.id}
              onPress={() => onToggle(habit.id)}
              disabled={isDisabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled: isDisabled }}
              accessibilityLabel={`${habit.name}. ${habit.hint}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Space.md,
                minHeight: 64,
                paddingVertical: Space.md,
                paddingHorizontal: Space.md + 2,
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: isSelected ? colors.accentBorder : colors.border,
                backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
              })}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: Radius.sm,
                  backgroundColor: colors.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <HabitGlyph name={habit.icon} size={19} color={habit.color} />
              </View>

              <View style={{ flex: 1, gap: Space.xxs }}>
                <AppText variant="smallStrong">{habit.name}</AppText>
                <AppText variant="caption" tone="tertiary">
                  {habit.hint}
                </AppText>
              </View>

              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: Radius.pill,
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: colors.borderStrong,
                  backgroundColor: isSelected ? colors.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {isSelected ? <CheckIcon size={13} color={colors.accentText} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: Space.md,
        }}>
        <AppText variant="caption" tone={atLimit ? 'accent' : 'tertiary'}>
          {selected.length} of {STARTER_HABIT_MAX} chosen
        </AppText>
        <TextLink label="Skip for now" align="right" onPress={onSkip} />
      </View>

      {saving ? (
        <AppText variant="caption" tone="tertiary" style={{ marginTop: Space.sm }}>
          Setting things up…
        </AppText>
      ) : null}
    </View>
  );
}

function DetailsStep({
  displayName,
  onChangeName,
  timezone,
  eveningTime,
  onChangeEveningTime,
  saving,
  error,
}: {
  displayName: string;
  onChangeName: (value: string) => void;
  timezone: string;
  eveningTime: string;
  onChangeEveningTime: (value: string) => void;
  saving: boolean;
  error: string | null;
}) {
  const { colors } = useTheme();

  return (
    <View>
      <AppText variant="title">A few last details</AppText>
      <AppText variant="small" tone="secondary" style={{ marginTop: Space.sm }}>
        These only affect how Pace greets you and when a day starts and ends.
      </AppText>

      <View style={{ marginTop: Space.xl, gap: Space.xl }}>
        <TextField
          label="What should we call you?"
          value={displayName}
          onChangeText={onChangeName}
          placeholder="Optional"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          editable={!saving}
        />

        <View style={{ gap: Space.sm }}>
          <AppText variant="smallStrong">Time zone</AppText>
          <View
            style={{
              minHeight: 46,
              justifyContent: 'center',
              paddingHorizontal: Space.md + 2,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
            }}>
            <AppText variant="small">{timeZoneLabel(timezone)}</AppText>
          </View>
          <AppText variant="caption" tone="tertiary">
            Detected from this device. It decides when &quot;today&quot; begins.
          </AppText>
        </View>

        <View style={{ gap: Space.sm }}>
          <AppText variant="smallStrong">Evening review</AppText>
          <AppText variant="caption" tone="tertiary">
            When should Pace ask you how the day went?
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
            {EVENING_TIMES.map((time) => {
              const isSelected = eveningTime === time;
              return (
                <Pressable
                  key={time}
                  onPress={() => onChangeEveningTime(time)}
                  disabled={saving}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${time} in the evening`}
                  style={({ pressed }) => ({
                    minWidth: 62,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: Space.md,
                    borderRadius: Radius.pill,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accentBorder : colors.border,
                    backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <AppText
                    variant="smallStrong"
                    color={isSelected ? colors.accent : colors.textSecondary}>
                    {time}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <FormMessage tone="error" message={error} /> : null}
      </View>
    </View>
  );
}
