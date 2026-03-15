import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

const STEPS = [
  { icon: 'person', label: 'Build your character' },
  { icon: 'category', label: 'Choose your growth areas' },
  { icon: 'rocket-launch', label: 'Start your journey' },
];

export default function OnboardingIntro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}>
      <Image
        source={require('@/assets/images/onboarding-hero.png')}
        style={styles.heroImg}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.overlay} />

      {/* Step counter */}
      <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
        <View style={styles.progressTrack}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, i === 0 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
      </View>

      <View style={styles.content}>
        {/* Badge */}
        <View style={styles.badge}>
          <MaterialIcons name="bolt" size={13} color={Colors.gold} />
          <Text style={styles.badgeText}>Real life. Real progress.</Text>
        </View>

        <Text style={styles.title}>Your character.{'\n'}Your real life.</Text>
        <Text style={styles.subtitle}>
          Complete daily actions, earn XP, and level up who you actually are — not a fictional hero.
        </Text>

        {/* 3-step preview */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <MaterialIcons name={step.icon as any} size={16} color={Colors.gold} />
              </View>
              <Text style={styles.stepItemText}>{step.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
          onPress={() => router.push('/onboarding/avatar')}
        >
          <Text style={styles.btnText}>Create My Character</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
        </Pressable>

        <Text style={styles.timeHint}>Takes about 2 minutes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, height: '62%' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(237,232,223,0.35)',
  },
  topBar: {
    position: 'absolute', left: Spacing.xl, right: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(42,26,10,0.2)' },
  progressDotActive: { backgroundColor: Colors.gold, width: 24, borderRadius: 3 },
  stepLabel: { fontSize: FontSize.sm, color: 'rgba(42,26,10,0.5)', fontWeight: FontWeight.medium },

  content: {
    flex: 1, justifyContent: 'flex-end', padding: Spacing.xl, gap: Spacing.md,
  },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },

  title: {
    fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy,
    color: Colors.textPrimary, lineHeight: 42,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },

  stepsRow: {
    flexDirection: 'column', gap: Spacing.sm,
    backgroundColor: Colors.surface + 'CC', borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    marginVertical: Spacing.xs,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  stepItemText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },

  btn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  timeHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: -Spacing.xs },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
