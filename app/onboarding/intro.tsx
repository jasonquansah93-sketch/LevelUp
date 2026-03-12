import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

const PILLARS = [
  { icon: 'bolt', text: 'Earn XP from real-world actions' },
  { icon: 'toll', text: 'Track weekly progress fairly across categories' },
  { icon: 'local-fire-department', text: 'Build streaks. Stay consistent.' },
  { icon: 'person', text: 'Watch your avatar evolve as you grow' },
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

      <View style={styles.content}>
        <View style={styles.step}>
          <Text style={styles.stepText}>Step 1 of 4</Text>
          <View style={styles.stepDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        </View>

        <Text style={styles.title}>This is your{'\n'}real-life character.</Text>
        <Text style={styles.subtitle}>
          Every action you take in the real world earns progress here. No shortcuts. No fakes.
        </Text>

        <View style={styles.pillars}>
          {PILLARS.map((p) => (
            <View key={p.text} style={styles.pillarRow}>
              <View style={styles.pillarIcon}>
                <MaterialIcons name={p.icon as any} size={18} color={Colors.gold} />
              </View>
              <Text style={styles.pillarText}>{p.text}</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
    backgroundColor: 'rgba(15,15,19,0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  stepText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  stepDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceBorder },
  dotActive: { backgroundColor: Colors.gold, width: 18 },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, lineHeight: 40 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  pillars: { gap: Spacing.sm },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pillarIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  pillarText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium, flex: 1 },
  btn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
