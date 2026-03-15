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

// Per-category intensity descriptions: [light, standard, focused]
const INTENSITY_CONTEXT: Record<string, {
  light: { tagline: string; detail: string };
  standard: { tagline: string; detail: string };
  focused: { tagline: string; detail: string };
}> = {
  fitness: {
    light: { tagline: 'Easy start', detail: 'Lower weekly target. Build momentum without pressure. Great if you are just getting started.' },
    standard: { tagline: 'Balanced challenge', detail: 'Recommended for most users. Sustainable effort with meaningful weekly progress.' },
    focused: { tagline: 'Training mode', detail: 'Higher weekly target. Best if fitness is a top priority and you train regularly.' },
  },
  health: {
    light: { tagline: 'Gentle habits', detail: 'Smallest target. Focus on building awareness before intensity.' },
    standard: { tagline: 'Daily care', detail: 'Balanced approach to nutrition, hydration, and recovery.' },
    focused: { tagline: 'Committed', detail: 'High weekly target for those who treat health as a non-negotiable priority.' },
  },
  sleep: {
    light: { tagline: 'Sleep awareness', detail: 'Low commitment. Good if sleep improvement is a side goal.' },
    standard: { tagline: 'Consistent rest', detail: 'Regular sleep habits. Recommended for most users.' },
    focused: { tagline: 'Strict discipline', detail: 'Demanding weekly target. For those who want a hard sleep schedule.' },
  },
  learning: {
    light: { tagline: 'Casual exploration', detail: 'Light weekly target. Great for when learning is secondary to other goals.' },
    standard: { tagline: 'Steady growth', detail: 'Balanced weekly sessions. Builds real skills over time.' },
    focused: { tagline: 'Intensive study', detail: 'High target. Choose this if skill-building is your main focus this week.' },
  },
  reading: {
    light: { tagline: 'Light habit', detail: 'Low-pressure reading goal. Good for getting a habit started.' },
    standard: { tagline: 'Regular reader', detail: 'Realistic weekly reading target that fits a busy schedule.' },
    focused: { tagline: 'Deep reading', detail: 'High weekly page count. For those who want reading to be a core habit.' },
  },
  focus: {
    light: { tagline: 'Entry level', detail: 'Build consistency first. Fewer deep work sessions required per week.' },
    standard: { tagline: 'Solid focus', detail: 'Balanced weekly deep work. Recommended for knowledge workers.' },
    focused: { tagline: 'Elite mode', detail: 'Demanding focus target. For users who want maximum cognitive output.' },
  },
  discipline: {
    light: { tagline: 'Habit building', detail: 'Early-stage discipline. Good for building your first routines.' },
    standard: { tagline: 'Solid consistency', detail: 'Regular discipline practices. The right choice for most users.' },
    focused: { tagline: 'Iron mode', detail: 'High weekly target. For users who want structure and real pressure.' },
  },
  order: {
    light: { tagline: 'Light tidying', detail: 'Low-frequency order habits. Good if this is a background goal.' },
    standard: { tagline: 'Regular order', detail: 'Consistent cleaning and organization habits throughout the week.' },
    focused: { tagline: 'Thorough', detail: 'High weekly target. For those who want a consistently clean environment.' },
  },
  career: {
    light: { tagline: 'Casual effort', detail: 'Low investment. Good if career development is not a priority this week.' },
    standard: { tagline: 'Steady growth', detail: 'Balanced weekly career actions. Good for long-term visibility.' },
    focused: { tagline: 'Ambitious', detail: 'High weekly career target. For those actively building their next chapter.' },
  },
  communication: {
    light: { tagline: 'Low-friction', detail: 'Light weekly communication practice. Good for building the habit first.' },
    standard: { tagline: 'Regular practice', detail: 'Consistent weekly effort on clarity and intentional communication.' },
    focused: { tagline: 'Sharp', detail: 'High weekly target. For those actively improving communication as a skill.' },
  },
  finance: {
    light: { tagline: 'Awareness mode', detail: 'Low frequency. Building basic financial awareness and tracking habits.' },
    standard: { tagline: 'Regular tracking', detail: 'Steady weekly financial habits. Recommended for most users.' },
    focused: { tagline: 'Committed', detail: 'High weekly target. For those actively working on financial discipline.' },
  },
  social: {
    light: { tagline: 'Gentle connection', detail: 'Low weekly effort. Good if social goals are secondary this week.' },
    standard: { tagline: 'Regular outreach', detail: 'Balanced weekly social actions. Maintains key relationships.' },
    focused: { tagline: 'Actively connected', detail: 'High weekly target. For those who want social growth to be a priority.' },
  },
};

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

  const setIntensity = (catId: string, val: Intensity) =>
    setIntensities((p) => ({ ...p, [catId]: val }));

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

  const INTENSITY_LEVELS: { id: Intensity; icon: string }[] = [
    { id: 'light', icon: 'battery-1-bar' },
    { id: 'standard', icon: 'battery-3-bar' },
    { id: 'focused', icon: 'battery-full' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.progressTrack}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 4 of 4</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Set your ambition</Text>
        <View style={styles.fairnessCard}>
          <MaterialIcons name="balance" size={16} color={Colors.info} />
          <Text style={styles.fairnessText}>
            Your score is measured against your own target — not others. Every level stays fair.
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {selectedCategories.map((catId) => {
          const cat = getCategoryById(catId);
          if (!cat) return null;
          const color = CategoryColors[cat.name] || Colors.gold;
          const intensity = intensities[catId] || 'standard';
          const ctx = INTENSITY_CONTEXT[catId];
          const currentCtx = ctx?.[intensity];
          const labels = cat.intensityLabels || { light: 'Light', standard: 'Standard', focused: 'Focused' };
          const credits = cat.weeklyTargetCredits[intensity];

          return (
            <View key={catId} style={styles.catCard}>
              {/* Category header */}
              <View style={styles.catHeader}>
                <View style={[styles.catIcon, { backgroundColor: color + '22' }]}>
                  <MaterialIcons name={cat.icon as any} size={22} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catTarget}>
                    <Text style={{ color, fontWeight: FontWeight.bold }}>{credits}</Text>
                    {' '}credits/week target
                  </Text>
                </View>
              </View>

              {/* Intensity selector */}
              <View style={styles.intensityRow}>
                {INTENSITY_LEVELS.map(({ id: level }) => {
                  const isActive = intensity === level;
                  return (
                    <Pressable
                      key={level}
                      style={({ pressed }) => [
                        styles.intensityChip,
                        isActive && { backgroundColor: color, borderColor: color },
                        pressed && styles.pressed,
                      ]}
                      onPress={() => setIntensity(catId, level)}
                    >
                      <Text style={[styles.intensityLabel, isActive && styles.intensityLabelActive]}>
                        {labels[level]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Context explanation for selected intensity */}
              {currentCtx && (
                <View style={[styles.contextBox, { borderLeftColor: color }]}>
                  <Text style={[styles.contextTagline, { color }]}>{currentCtx.tagline}</Text>
                  <Text style={styles.contextDetail}>{currentCtx.detail}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Bottom summary card */}
        <View style={styles.summaryCard}>
          <MaterialIcons name="check-circle-outline" size={18} color={Colors.success} />
          <Text style={styles.summaryText}>
            You can always change your intensity from the Profile tab after you start.
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
  progressTrack: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceBorder },
  dotActive: { backgroundColor: Colors.gold, width: 18 },
  stepLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },

  header: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },

  fairnessCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.infoSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.info + '30',
  },
  fairnessText: { fontSize: FontSize.sm, color: Colors.info, flex: 1, lineHeight: 20 },

  scroll: { padding: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.md },

  catCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.md,
  },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  catIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  catTarget: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  intensityRow: { flexDirection: 'row', gap: Spacing.sm },
  intensityChip: {
    flex: 1, height: 40, borderRadius: Radius.round,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  intensityLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  intensityLabelActive: { color: '#fff' },

  contextBox: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm,
    padding: Spacing.sm, borderLeftWidth: 3, gap: 2,
  },
  contextTagline: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  contextDetail: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  summaryCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.successSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '30',
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.success, flex: 1, lineHeight: 20 },

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
