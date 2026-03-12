import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORIES, QUEST_TEMPLATES, getCategoryById } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

const MAX_QUESTS_PER_CATEGORY_FREE = 2;

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
      if (curr.length >= MAX_QUESTS_PER_CATEGORY_FREE) return prev;
      return { ...prev, [activeTab]: [...curr, questId] };
    });
  };

  const handleNext = () => {
    router.push({ pathname: '/onboarding/targets', params: {
      categories: JSON.stringify(selectedCategories),
      quests: JSON.stringify(selectedQuests),
    } });
  };

  const totalSelected = Object.values(selectedQuests).reduce((s, q) => s + q.length, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.stepDots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>4 / 4</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Set Up Your Quests</Text>
        <Text style={styles.subtitle}>Pick up to 2 quests per category to start tracking.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
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
              <MaterialIcons name={cat.icon as any} size={16} color={isActive ? color : Colors.textSecondary} />
              <Text style={[styles.tabText, isActive && { color }]}>{cat.name}</Text>
              {count > 0 && (
                <View style={[styles.tabCount, { backgroundColor: color }]}>
                  <Text style={styles.tabCountText}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {selectedQuests[activeTab]?.length || 0} / {MAX_QUESTS_PER_CATEGORY_FREE} quests selected
          </Text>
        </View>
        {catQuests.map((quest) => {
          const isSelected = (selectedQuests[activeTab] || []).includes(quest.id);
          const isDisabled = !isSelected && (selectedQuests[activeTab] || []).length >= MAX_QUESTS_PER_CATEGORY_FREE;
          const cat = getCategoryById(activeTab);
          const color = CategoryColors[cat?.name || ''] || Colors.gold;
          return (
            <Pressable
              key={quest.id}
              style={[styles.questCard, isSelected && { borderColor: color }, isDisabled && styles.questDisabled]}
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
          style={({ pressed }) => [styles.btn, totalSelected === 0 && styles.btnDisabled, pressed && styles.pressed]}
          onPress={handleNext}
        >
          <Text style={styles.btnText}>Set Weekly Targets</Text>
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
  stepDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceBorder },
  dotActive: { backgroundColor: Colors.gold, width: 18 },
  stepLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  header: { paddingHorizontal: Spacing.xl, gap: 4, marginBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  tabsScroll: { maxHeight: 52 },
  tabsContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, alignItems: 'center' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 38, borderRadius: Radius.round,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  tabCount: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  tabCountText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#fff' },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.md },
  hint: { marginBottom: Spacing.md },
  hintText: { fontSize: FontSize.sm, color: Colors.textMuted },
  questCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md,
  },
  questDisabled: { opacity: 0.35 },
  questLeft: { flex: 1, gap: 4 },
  questName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  questDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  questMeta: { flexDirection: 'row', gap: Spacing.xs, marginTop: 2 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  metaText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gold },
  questCheck: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
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
