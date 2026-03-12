import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { AvatarDisplay } from '@/components/feature/AvatarDisplay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuestCompletionModal } from '@/components/feature/QuestCompletionModal';
import { QUEST_TEMPLATES, getCategoryById } from '@/constants/gameData';
import { QuestCompletion } from '@/contexts/GameContext';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors, Shadows } from '@/constants/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { state, completeQuest, getXpInfo, getTodayCompletions, getCategoryScore } = useGame();

  const [modalVisible, setModalVisible] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<QuestCompletion | null>(null);
  const [lastQuestName, setLastQuestName] = useState('');
  const [lastCategoryName, setLastCategoryName] = useState('');

  const xpInfo = getXpInfo();
  const todayCompletions = getTodayCompletions();
  const todayQuestIds = new Set(todayCompletions.map((c) => c.questId));
  const todayByQuestId: Record<string, number> = {};
  todayCompletions.forEach((c) => { todayByQuestId[c.questId] = (todayByQuestId[c.questId] || 0) + 1; });

  const handleComplete = (questId: string) => {
    const completion = completeQuest(questId);
    if (!completion) return;
    const template = QUEST_TEMPLATES.find((q) => q.id === questId);
    const cat = getCategoryById(template?.categoryId || '');
    setLastCompletion(completion);
    setLastQuestName(template?.name || '');
    setLastCategoryName(cat?.name || '');
    setModalVisible(true);
  };

  const weeklyScore = Math.round(state.weeklyFairnessScore);
  const isGoodDay = state.streak.categoriesCompletedToday.length >= 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.tagline}>Level up your real life.</Text>
          </View>
          <AvatarDisplay avatar={state.avatar} level={xpInfo.level} size="md" />
        </View>

        {/* XP Bar */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <View style={styles.levelBadge}>
              <MaterialIcons name="bolt" size={14} color={Colors.textInverse} />
              <Text style={styles.levelText}>Level {xpInfo.level}</Text>
            </View>
            <Text style={styles.xpText}>{xpInfo.current} / {xpInfo.next} XP</Text>
          </View>
          <ProgressBar progress={xpInfo.progress} color={Colors.gold} height={8} />
          <Text style={styles.xpHint}>
            {xpInfo.next - xpInfo.current} XP to Level {xpInfo.level + 1}
          </Text>
        </View>

        {/* Streaks */}
        <View style={styles.streakRow}>
          <View style={[styles.streakCard, isGoodDay && styles.streakCardActive]}>
            <MaterialIcons name="local-fire-department" size={22} color={Colors.amber} />
            <Text style={styles.streakNum}>{state.streak.dailyStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={[styles.streakCard, state.streak.categoriesCompletedToday.length >= 2 && styles.streakStrongActive]}>
            <MaterialIcons name="shield" size={22} color={Colors.info} />
            <Text style={styles.streakNum}>{state.streak.strongStreak}</Text>
            <Text style={styles.streakLabel}>Strong Streak</Text>
          </View>
          <View style={styles.streakCard}>
            <MaterialIcons name="insights" size={22} color={Colors.success} />
            <Text style={styles.streakNum}>{weeklyScore}%</Text>
            <Text style={styles.streakLabel}>Weekly Score</Text>
          </View>
        </View>

        {/* Today's Quests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Quests</Text>
            <Text style={styles.sectionSub}>{todayCompletions.length} completed</Text>
          </View>

          {state.activeQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="add-circle-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No quests set up yet</Text>
              <Text style={styles.emptyText}>Go to Profile → Manage Quests to add quests.</Text>
            </View>
          ) : (
            state.activeQuests.map((quest) => {
              const template = QUEST_TEMPLATES.find((t) => t.id === quest.questId);
              if (!template) return null;
              const cat = getCategoryById(quest.categoryId);
              const catColor = CategoryColors[cat?.name || ''] || Colors.gold;
              const completionCount = todayByQuestId[quest.questId] || 0;
              const isCompleted = completionCount > 0;

              return (
                <Pressable
                  key={quest.questId}
                  style={({ pressed }) => [
                    styles.questRow,
                    { borderLeftColor: catColor },
                    isCompleted && styles.questRowDone,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleComplete(quest.questId)}
                >
                  <View style={styles.questInfo}>
                    <View style={styles.questTop}>
                      <Text style={[styles.questName, isCompleted && styles.questNameDone]}>{quest.name}</Text>
                      {isCompleted ? (
                        <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                      ) : (
                        <View style={styles.questCircle} />
                      )}
                    </View>
                    <View style={styles.questMeta}>
                      <View style={[styles.catTag, { backgroundColor: catColor + '20' }]}>
                        <Text style={[styles.catTagText, { color: catColor }]}>{cat?.name}</Text>
                      </View>
                      <View style={styles.xpTag}>
                        <MaterialIcons name="bolt" size={11} color={Colors.gold} />
                        <Text style={styles.xpTagText}>{quest.characterXp} XP</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Weekly Category Snapshot */}
        {state.activeCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            {state.activeCategories.map((ac) => {
              const cat = getCategoryById(ac.categoryId);
              if (!cat) return null;
              const score = getCategoryScore(ac.categoryId);
              const color = CategoryColors[cat.name] || Colors.gold;
              return (
                <View key={ac.categoryId} style={styles.weekCatRow}>
                  <View style={[styles.weekCatIcon, { backgroundColor: color + '20' }]}>
                    <MaterialIcons name={cat.icon as any} size={16} color={color} />
                  </View>
                  <View style={styles.weekCatInfo}>
                    <View style={styles.weekCatTop}>
                      <Text style={styles.weekCatName}>{cat.name}</Text>
                      <Text style={[styles.weekCatPct, { color: score.completionPct >= 80 ? Colors.success : Colors.textSecondary }]}>
                        {Math.round(score.completionPct)}%
                      </Text>
                    </View>
                    <ProgressBar progress={score.completionPct / 100} color={color} height={5} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <QuestCompletionModal
        visible={modalVisible}
        completion={lastCompletion}
        questName={lastQuestName}
        categoryName={lastCategoryName}
        categoryCompletionPct={lastCompletion ? getCategoryScore(lastCompletion.categoryId).completionPct : 0}
        streakDay={state.streak.dailyStreak}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flex: 1, gap: 2 },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tagline: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  xpCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  xpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gold, borderRadius: Radius.round,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  levelText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },
  xpText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  xpHint: { fontSize: FontSize.xs, color: Colors.textMuted },
  streakRow: { flexDirection: 'row', gap: Spacing.sm },
  streakCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  streakCardActive: { borderColor: Colors.amber + '60', backgroundColor: Colors.warningSoft },
  streakStrongActive: { borderColor: Colors.info + '60', backgroundColor: Colors.infoSoft },
  streakNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  streakLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  emptyState: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  questRow: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, borderLeftWidth: 4,
  },
  questRowDone: { opacity: 0.6, borderColor: Colors.success + '40' },
  questInfo: { gap: Spacing.xs },
  questTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  questNameDone: { color: Colors.textSecondary },
  questCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.surfaceBorder },
  questMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  catTag: { borderRadius: Radius.round, paddingHorizontal: 8, paddingVertical: 2 },
  catTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  xpTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  xpTagText: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: FontWeight.semibold },
  weekCatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  weekCatIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  weekCatInfo: { flex: 1, gap: 6 },
  weekCatTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekCatName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  weekCatPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
