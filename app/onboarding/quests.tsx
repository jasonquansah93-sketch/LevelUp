import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { QUEST_TEMPLATES, getCategoryById } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

const MAX_QUESTS_PER_CAT = 2;

export default function QuestSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categories: string }>();

  const selectedCategories: string[] = useMemo(() => {
    try { return JSON.parse(params.categories || '[]'); } catch { return []; }
  }, [params.categories]);

  const [activeTab, setActiveTab] = useState(selectedCategories[0] || '');
  const [selectedQuests, setSelectedQuests] = useState<Record<string, string[]>>(
    Object.fromEntries(selectedCategories.map((c) => [c, []]))
  );

  const catQuests = useMemo(
    () => QUEST_TEMPLATES.filter((q) => q.categoryId === activeTab).slice(0, 8),
    [activeTab]
  );

  const toggleQuest = (questId: string) => {
    setSelectedQuests((prev) => {
      const curr = prev[activeTab] || [];
      if (curr.includes(questId)) return { ...prev, [activeTab]: curr.filter((q) => q !== questId) };
      if (curr.length >= MAX_QUESTS_PER_CAT) return prev;
      return { ...prev, [activeTab]: [...curr, questId] };
    });
  };

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/targets',
      params: { categories: JSON.stringify(selectedCategories), quests: JSON.stringify(selectedQuests) },
    });
  };

  const totalSelected = Object.values(selectedQuests).reduce((s, q) => s + q.length, 0);
  const activeSelected = selectedQuests[activeTab]?.length || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.progressTrack}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>4 of 4</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Pick your first quests</Text>
        <Text style={styles.subtitle}>Start with 1–2 per category. You can add more later.</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {selectedCategories.map((catId) => {
            const cat = getCategoryById(catId);
            if (!cat) return null;
            const color = CategoryColors[cat.name] || Colors.gold;
            const count = (selectedQuests[catId] || []).length;
            const isActive = activeTab === catId;
            return (
              <Pressable
                key={catId}
                style={[styles.tab, isActive && { borderColor: color, backgroundColor: color + '15' }]}
                onPress={() => setActiveTab(catId)}
              >
                <MaterialIcons name={cat.icon as any} size={14} color={isActive ? color : Colors.textSecondary} />
                <Text style={[styles.tabText, isActive && { color }]}>{cat.name}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: color }]}>
                    <Text style={styles.tabBadgeText}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>{activeSelected} / {MAX_QUESTS_PER_CAT} selected for this category</Text>

        {catQuests.map((quest) => {
          const isSelected = (selectedQuests[activeTab] || []).includes(quest.id);
          const isDisabled = !isSelected && (selectedQuests[activeTab] || []).length >= MAX_QUESTS_PER_CAT;
          const cat = getCategoryById(activeTab);
          const color = CategoryColors[cat?.name || ''] || Colors.gold;

          return (
            <Pressable
              key={quest.id}
              style={({ pressed }) => [
                styles.questCard,
                isSelected && { borderColor: color, backgroundColor: color + '08' },
                isDisabled && styles.questDisabled,
                pressed && !isDisabled && styles.questPressed,
              ]}
              onPress={() => toggleQuest(quest.id)}
              disabled={isDisabled}
            >
              <View style={styles.questLeft}>
                <Text style={[styles.questName, isSelected && { color }]}>{quest.name}</Text>
                <Text style={styles.questDesc} numberOfLines={2}>{quest.description}</Text>
                <View style={styles.questMeta}>
                  <View style={styles.metaChip}>
                    <MaterialIcons name="bolt" size={11} color={Colors.gold} />
                    <Text style={styles.metaText}>{quest.characterXp} XP</Text>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: Colors.infoSoft }]}>
                    <MaterialIcons name="toll" size={11} color={Colors.info} />
                    <Text style={[styles.metaText, { color: Colors.info }]}>{quest.weeklyCredits} cr</Text>
                  </View>
                  {quest.durationMinutes ? (
                    <View style={[styles.metaChip, { backgroundColor: Colors.surfaceElevated }]}>
                      <MaterialIcons name="schedule" size={11} color={Colors.textMuted} />
                      <Text style={[styles.metaText, { color: Colors.textMuted }]}>{quest.durationMinutes}min</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={[styles.questCheck, isSelected && { backgroundColor: color, borderColor: color }]}>
                {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
            </Pressable>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
          onPress={handleNext}
        >
          <Text style={styles.btnText}>
            {totalSelected === 0 ? 'Skip & Use Defaults' : 'Set Targets'}
          </Text>
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
  header: { paddingHorizontal: Spacing.xl, gap: 4, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  tabsWrap: { height: 52 },
  tabsContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, alignItems: 'center', height: 52 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 38, borderRadius: Radius.round,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#fff' },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.md },
  hint: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  questCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md,
  },
  questDisabled: { opacity: 0.35 },
  questPressed: { transform: [{ scale: 0.99 }] },
  questLeft: { flex: 1, gap: 4 },
  questName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  questDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  questMeta: { flexDirection: 'row', gap: Spacing.xs, marginTop: 2, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  metaText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gold },
  questCheck: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
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
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
