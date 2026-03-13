import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

const VALUE_PROPS = [
  { icon: 'bolt', text: 'Earn XP from real actions' },
  { icon: 'local-fire-department', text: 'Build daily streaks' },
  { icon: 'leaderboard', text: 'Compare with friends' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image
        source={require('@/assets/images/onboarding-hero.png')}
        style={styles.hero}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.overlay} />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LEVEL UP YOUR REAL LIFE</Text>
        </View>

        <Text style={styles.title}>Build a Stronger{'\n'}Version of Yourself</Text>
        <Text style={styles.subtitle}>
          Complete real-life quests. Earn XP. Track who you are becoming.
        </Text>

        <View style={styles.valueProps}>
          {VALUE_PROPS.map((v) => (
            <View key={v.text} style={styles.valueProp}>
              <View style={styles.valuePropIcon}>
                <MaterialIcons name={v.icon as any} size={14} color={Colors.gold} />
              </View>
              <Text style={styles.valuePropText}>{v.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(237,232,223,0.30)',
  },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, paddingTop: Spacing.xxl,
    backgroundColor: 'rgba(250,247,241,0.97)',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    gap: Spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start', backgroundColor: Colors.goldSoft,
    borderRadius: Radius.round, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.gold + '40', marginBottom: Spacing.xs,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold, letterSpacing: 1.5 },
  title: {
    fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy,
    color: Colors.textPrimary, lineHeight: 40,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.xs, includeFontPadding: false },
  valueProps: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', marginBottom: Spacing.sm },
  valueProp: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valuePropIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  valuePropText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  primaryBtn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs,
  },
  primaryBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  secondaryBtn: { height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
