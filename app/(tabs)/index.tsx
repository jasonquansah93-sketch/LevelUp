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
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

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

  const todayDoneCount = todayCompletions.length;
  const totalQuests = state.activeQuests.length;
  const weeklyScore = Math.round(state.weeklyFairnessScore);

  // Separate completed and pending quests
  const pendingQuests = state.activeQuests.filter((q) => !(todayByQuestId[q.questId] > 0));
  const completedQuests = state.activeQuests.filter((q) => todayByQuestId[q.questId] > 0);

  // Featured quest = first uncompleted one
  const featuredQuest = pendingQuests[0] || null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Identity Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.tagline}>Level up your real life.</Text>
          </View>
          <AvatarDisplay avatar={state.avatar} level={xpInfo.level} size="md" />
        </View>

        {/* XP Progress */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <View style={styles.levelPill}>
              <MaterialIcons name="bolt" size={12} color={Colors.textInverse} />
              <Text style={styles.levelPillText}>Lv. {xpInfo.level}</Text>
            </View>
            <Text style={styles.xpText}>{xpInfo.current} / {xpInfo.next} XP</Text>
          </View>
          <ProgressBar progress={xpInfo.progress} color={Colors.gold} height={8} />
          <Text style={styles.xpHint}>{xpInfo.next - xpInfo.current} XP to Level {xpInfo.level + 1}</Text>
        </View>

        {/* Streak + Score pills */}
        <View style={styles.statsRow}>
          <View style={[styles.statPill, state.streak.dailyStreak > 0 && styles.statPillActive]}>
            <MaterialIcons name="local-fire-department" size={16} color={Colors.amber} />
            <Text style={styles.statPillValue}>{state.streak.dailyStreak}</Text>
            <Text style={styles.statPillLabel}>day streak</Text>
          </View>
          <View style={styles.statPill}>
            <MaterialIcons name="shield" size={16} color={Colors.info} />
            <Text style={styles.statPillValue}>{state.streak.strongStreak}</Text>
            <Text style={styles.statPillLabel}>strong</Text>
          </View>
          <View style={styles.statPill}>
            <MaterialIcons name="insights" size={16} color={Colors.success} />
            <Text style={styles.statPillValue}>{weeklyScore}%</Text>
            <Text style={styles.statPillLabel}>this week</Text>
          </View>
        </View>

        {/* Featured Quest — the most important visual on Home */}
        {featuredQuest ? (
          <View style={styles.featuredSection}>
            <Text style={styles.featuredLabel}>
              {todayDoneCount === 0 ? 'Start here' : 'Next up'}
            </Text>
            <FeaturedQuestCard
              quest={featuredQuest}
              onComplete={() => handleComplete(featuredQuest.questId)}
            />
          </View>
        ) : totalQuests === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="add-circle-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No quests set up</Text>
            <Text style={styles.emptyText}>Go to Profile → Manage Quests to add quests to your daily list.</Text>
          </View>
        ) : (
          <View style={styles.allDoneState}>
            <MaterialIcons name="check-circle" size={36} color={Colors.success} />
            <Text style={styles.allDoneTitle}>All done for today.</Text>
            <Text style={styles.allDoneText}>Keep the streak going tomorrow.</Text>
          </View>
        )}

        {/* Other quests */}
        {pendingQuests.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other quests</Text>
            {pendingQuests.slice(1).map((quest) => {
              const template = QUEST_TEMPLATES.find((t) => t.id === quest.questId);
              if (!template) return null;
              const cat = getCategoryById(quest.categoryId);
              const catColor = CategoryColors[cat?.name || ''] || Colors.gold;

              return (
                <Pressable
                  key={quest.questId}
                  style={({ pressed }) => [styles.questRow, { borderLeftColor: catColor }, pressed && styles.pressed]}
                  onPress={() => handleComplete(quest.questId)}
                >
                  <View style={styles.questInfo}>
                    <Text style={styles.questName}>{quest.name}</Text>
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
                  <View style={styles.questCircle} />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Completed today */}
        {completedQuests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed today</Text>
            {completedQuests.map((quest) => {
              const cat = getCategoryById(quest.categoryId);
              const catColor = CategoryColors[cat?.name || ''] || Colors.gold;
              return (
                <Pressable
                  key={quest.questId}
                  style={({ pressed }) => [
                    styles.questRow, { borderLeftColor: catColor },
                    styles.questRowDone, pressed && styles.pressed,
                  ]}
                  onPress={() => handleComplete(quest.questId)}
                >
                  <View style={styles.questInfo}>
                    <Text style={[styles.questName, styles.questNameDone]}>{quest.name}</Text>
                    <View style={styles.questMeta}>
                      <View style={[styles.catTag, { backgroundColor: catColor + '20' }]}>
                        <Text style={[styles.catTagText, { color: catColor }]}>{cat?.name}</Text>
                      </View>
                    </View>
                  </View>
                  <MaterialIcons name="check-circle" size={22} color={Colors.success} />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Weekly snapshot */}
        {state.activeCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This week</Text>
            <View style={styles.weekCard}>
              {state.activeCategories.map((ac) => {
                const cat = getCategoryById(ac.categoryId);
                if (!cat) return null;
                const score = getCategoryScore(ac.categoryId);
                const color = CategoryColors[cat.name] || Colors.gold;
                return (
                  <View key={ac.categoryId} style={styles.weekRow}>
                    <View style={[styles.weekIcon, { backgroundColor: color + '20' }]}>
                      <MaterialIcons name={cat.icon as any} size={14} color={color} />
                    </View>
                    <View style={styles.weekInfo}>
                      <View style={styles.weekTop}>
                        <Text style={styles.weekName}>{cat.name}</Text>
                        <Text style={[
                          styles.weekPct,
                          { color: score.completionPct >= 80 ? Colors.success : score.completionPct >= 40 ? Colors.gold : Colors.textSecondary },
                        ]}>
                          {Math.round(score.completionPct)}%
                        </Text>
                      </View>
                      <ProgressBar progress={score.completionPct / 100} color={color} height={4} />
                    </View>
                  </View>
                );
              })}
            </View>
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

function FeaturedQuestCard({ quest, onComplete }: { quest: { questId: string; categoryId: string; name: string; characterXp: number; weeklyCredits: number }; onComplete: () => void }) {
  const template = QUEST_TEMPLATES.find((t) => t.id === quest.questId);
  const cat = getCategoryById(quest.categoryId);
  const catColor = CategoryColors[cat?.name || ''] || Colors.gold;

  return (
    <Pressable
      style={({ pressed }) => [styles.featuredCard, { borderColor: catColor + '50' }, pressed && styles.featuredPressed]}
      onPress={onComplete}
    >
      <View style={[styles.featuredCatBar, { backgroundColor: catColor }]} />
      <View style={styles.featuredContent}>
        <View style={styles.featuredHeader}>
          <View style={[styles.featuredCatBadge, { backgroundColor: catColor + '20' }]}>
            {cat && <MaterialIcons name={cat.icon as any} size={14} color={catColor} />}
            <Text style={[styles.featuredCatText, { color: catColor }]}>{cat?.name}</Text>
          </View>
          {template?.durationMinutes ? (
            <View style={styles.durationBadge}>
              <MaterialIcons name="schedule" size={12} color={Colors.textMuted} />
              <Text style={styles.durationText}>{template.durationMinutes} min</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.featuredName}>{quest.name}</Text>
        {template && <Text style={styles.featuredDesc} numberOfLines={2}>{template.description}</Text>}

        <View style={styles.featuredFooter}>
          <View style={styles.featuredRewards}>
            <View style={styles.rewardPill}>
              <MaterialIcons name="bolt" size={14} color={Colors.gold} />
              <Text style={styles.rewardPillText}>+{quest.characterXp} XP</Text>
            </View>
            <View style={[styles.rewardPill, { backgroundColor: Colors.infoSoft }]}>
              <MaterialIcons name="toll" size={14} color={Colors.info} />
              <Text style={[styles.rewardPillText, { color: Colors.info }]}>+{quest.weeklyCredits} cr</Text>
            </View>
          </View>
          <View style={styles.completeBtn}>
            <MaterialIcons name="check" size={18} color={Colors.textInverse} />
            <Text style={styles.completeBtnText}>Log it</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
    padding: Spacing.md, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  xpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gold, borderRadius: Radius.round,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  levelPillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },
  xpText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  xpHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder, justifyContent: 'center',
  },
  statPillActive: { borderColor: Colors.amber + '60', backgroundColor: Colors.warningSoft },
  statPillValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statPillLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Featured quest
  featuredSection: { gap: Spacing.sm },
  featuredLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold, textTransform: 'uppercase', letterSpacing: 0.8 },
  featuredCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.gold + '30',
    flexDirection: 'row', overflow: 'hidden',
  },
  featuredPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  featuredCatBar: { width: 5 },
  featuredContent: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredCatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.round, paddingHorizontal: 10, paddingVertical: 4,
  },
  featuredCatText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  durationText: { fontSize: FontSize.xs, color: Colors.textMuted },
  featuredName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 26 },
  featuredDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  featuredRewards: { flexDirection: 'row', gap: Spacing.xs },
  rewardPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  rewardPillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  completeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },

  // Other quests
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  questRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, borderLeftWidth: 4,
  },
  questRowDone: { opacity: 0.55 },
  questInfo: { flex: 1, gap: Spacing.xs },
  questName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  questNameDone: { color: Colors.textSecondary },
  questMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  catTag: { borderRadius: Radius.round, paddingHorizontal: 8, paddingVertical: 2 },
  catTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  xpTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  xpTagText: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: FontWeight.semibold },
  questCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.surfaceBorder },

  // States
  emptyState: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  allDoneState: {
    backgroundColor: Colors.successSoft, borderRadius: Radius.lg, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.success + '40',
  },
  allDoneTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.success },
  allDoneText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Weekly
  weekCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.md,
  },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  weekIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  weekInfo: { flex: 1, gap: 5 },
  weekTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  weekPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
