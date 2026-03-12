import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORIES } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

const MAX_FREE = 3;
const RECOMMENDED = ['fitness', 'focus', 'discipline'];

export default function CategorySelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(RECOMMENDED);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_FREE) return prev;
      return [...prev, id];
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.progressTrack}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>3 of 4</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What do you want{'\n'}to level up?</Text>
        <Text style={styles.subtitle}>
          Pick up to {MAX_FREE} areas to focus on this week.
        </Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{selected.length} / {MAX_FREE} chosen</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            const isRecommended = RECOMMENDED.includes(cat.id);
            const catColor = CategoryColors[cat.name] || Colors.gold;
            const isDisabled = !isSelected && selected.length >= MAX_FREE;
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && { borderColor: catColor, borderWidth: 2 },
                  isDisabled && styles.cardDisabled,
                  pressed && !isDisabled && styles.cardPressed,
                ]}
                onPress={() => toggle(cat.id)}
                disabled={isDisabled}
              >
                {isRecommended && !isSelected && (
                  <View style={styles.recBadge}>
                    <Text style={styles.recBadgeText}>Recommended</Text>
                  </View>
                )}
                <View style={[styles.iconWrap, { backgroundColor: catColor + '22' }]}>
                  <MaterialIcons name={cat.icon as any} size={26} color={catColor} />
                </View>
                <Text style={[styles.catName, isSelected && { color: catColor }]}>{cat.name}</Text>
                <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: catColor }]}>
                    <MaterialIcons name="check" size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.btn, selected.length === 0 && styles.btnDisabled, pressed && styles.pressed]}
          onPress={() => {
            if (selected.length > 0) {
              router.push({ pathname: '/onboarding/quests', params: { categories: JSON.stringify(selected) } });
            }
          }}
          disabled={selected.length === 0}
        >
          <Text style={styles.btnText}>Pick First Quests</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, paddingBottom: Spacing.md,
  },
  progressTrack: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceBorder },
  dotActive: { backgroundColor: Colors.gold, width: 18 },
  stepLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  header: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.md },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, lineHeight: 40 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  counter: {
    alignSelf: 'flex-start', backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  counterText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: {
    width: '47.5%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.surfaceBorder,
    position: 'relative', overflow: 'hidden',
  },
  cardDisabled: { opacity: 0.35 },
  cardPressed: { transform: [{ scale: 0.97 }] },
  recBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  recBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.gold },
  iconWrap: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  catDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  btn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
