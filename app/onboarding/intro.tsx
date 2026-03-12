import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

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

      {/* Progress indicator */}
      <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
        <View style={styles.progressTrack}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, i === 0 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>1 of 4</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>This is your{'\n'}real-life character.</Text>
        <Text style={styles.subtitle}>
          Complete real actions. Earn XP. Level up who you actually are.
        </Text>

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
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,15,19,0.5)',
  },
  topBar: {
    position: 'absolute', left: Spacing.xl, right: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressDotActive: { backgroundColor: Colors.gold, width: 24, borderRadius: 3 },
  stepLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', fontWeight: FontWeight.medium },
  content: {
    flex: 1, justifyContent: 'flex-end', padding: Spacing.xl, gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy,
    color: Colors.textPrimary, lineHeight: 42,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.sm },
  btn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
