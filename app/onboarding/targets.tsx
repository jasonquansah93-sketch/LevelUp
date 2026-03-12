import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getCategoryById, QUEST_TEMPLATES } from '@/constants/gameData';
import { ActiveCategory, ActiveQuest } from '@/contexts/GameContext';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

type Intensity = 'light' | 'standard' | 'focused';

export default function TargetSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categories: string; quests: string }>();
  const { setActiveCategories, setActiveQuests } = useGame();
  const { completeOnboarding } = useAuth();

  const selectedCategories: string[] = useMemo(() => {
    try { return JSON.parse(params.categories || '[]'); } catch { return []; }
  }, [params.categories]);

  const selectedQuestsMap: Record<string, string[]> = useMemo(() => {
    try { return JSON.parse(params.quests || '{}'); } catch { return {}; }
  }, [params.quests]);

  const [intensities, setIntensities] = useState<Record<string, Intensity>>(
    Object.fromEntries(selectedCategories.map((c) => [c, 'standard']))
  );

  const setIntensity = (catId: string, val: Intensity) => setIntensities((p) => ({ ...p, [catId]: val }));

  const handleFinish = async () => {
    const activeCategories: ActiveCategory[] = selectedCategories.map((catId) => {
      const cat = getCategoryById(catId);
      const intensity = intensities[catId] || 'standard';
      const target = cat?.weeklyTargetCredits[intensity] || 8;
      return { categoryId: catId, intensity, weeklyTarget: target };
    });

    const activeQuests: ActiveQuest[] = [];
    for (const catId of selectedCategories) {
      const questIds = selectedQuestsMap[catId] || [];
      // If no quests selected for category, auto-add the top 2 easiest ones
      const idsToUse = questIds.length > 0
        ? questIds
        : QUEST_TEMPLATES
          .filter((q) => q.categoryId === catId)
          .sort((a, b) => a.characterXp - b.characterXp)
          .slice(0, 2)
          .map((q) => q.id);

      for (const questId of idsToUse) {
        const template = QUEST_TEMPLATES.find((q) => q.id === questId);
        if (template) {
          activeQuests.push({
            questId: template.id,
            categoryId: template.categoryId,
            name: template.name,
            characterXp: template.characterXp,
            weeklyCredits: template.weeklyCredits,
            difficulty: template.difficulty,
          });
        }
      }
    }

    await setActiveCategories(activeCategories);
    await setActiveQuests(activeQuests);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.topTitle}>Weekly Targets</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Set your intensity</Text>
        <Text style={styles.subtitle}>
          How ambitious do you want to be this week? You can always adjust this later.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {selectedCategories.map((catId) => {
          const cat = getCategoryById(catId);
          if (!cat) return null;
          const color = CategoryColors[cat.name] || Colors.gold;
          const intensity = intensities[catId] || 'standard';
          const labels = cat.intensityLabels || { light: 'Light', standard: 'Standard', focused: 'Focused' };

          return (
            <View key={catId} style={styles.catCard}>
              <View style={styles.catHeader}>
                <View style={[styles.catIcon, { backgroundColor: color + '22' }]}>
                  <MaterialIcons name={cat.icon as any} size={22} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catTarget}>
                    {cat.weeklyTargetCredits[intensity]} credits/week target
                  </Text>
                </View>
              </View>
              <View style={styles.intensityRow}>
                {(['light', 'standard', 'focused'] as Intensity[]).map((level) => (
                  <Pressable
                    key={level}
                    style={({ pressed }) => [
                      styles.intensityChip,
                      intensity === level && { backgroundColor: color, borderColor: color },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setIntensity(catId, level)}
                  >
                    <Text style={[styles.intensityText, intensity === level && styles.intensityTextActive]}>
                      {labels[level]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <MaterialIcons name="info-outline" size={18} color={Colors.info} />
          <Text style={styles.summaryText}>
            Your rank is always measured against your own target — not against others with different categories.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
          onPress={handleFinish}
        >
          <MaterialIcons name="rocket-launch" size={20} color={Colors.textInverse} />
          <Text style={styles.btnText}>Start My Journey</Text>
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
  topTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  header: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.md },
  catCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.md,
  },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  catIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  catTarget: { fontSize: FontSize.sm, color: Colors.textSecondary },
  intensityRow: { flexDirection: 'row', gap: Spacing.sm },
  intensityChip: {
    flex: 1, height: 40, borderRadius: Radius.round,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  intensityText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  intensityTextActive: { color: '#fff' },
  summaryCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.infoSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.info + '30',
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.info, flex: 1, lineHeight: 20 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  btn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
