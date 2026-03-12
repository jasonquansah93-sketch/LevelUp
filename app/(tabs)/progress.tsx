import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getCategoryById, BADGE_DEFINITIONS } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return Colors.success;
  if (pct >= 50) return Colors.gold;
  if (pct >= 25) return Colors.amber;
  return Colors.error;
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { state, getXpInfo } = useGame();
  const xpInfo = getXpInfo();

  const bestCategory = state.weeklyCategoryScores.length > 0
    ? state.weeklyCategoryScores.reduce((best, s) => s.completionPct > best.completionPct ? s : best)
    : null;
  const bestCat = bestCategory ? getCategoryById(bestCategory.categoryId) : null;

  const earnedBadges = BADGE_DEFINITIONS.filter((b) => state.badges.includes(b.id));
  const lockedBadges = BADGE_DEFINITIONS.filter((b) => !state.badges.includes(b.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Week {getWeekNumber()}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Weekly Fairness Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreTop}>
            <View>
              <Text style={styles.scoreLabel}>Weekly Fairness Score</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(state.weeklyFairnessScore) }]}>
                {Math.round(state.weeklyFairnessScore)}%
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(state.weeklyFairnessScore) + '20' }]}>
              <MaterialIcons name="insights" size={28} color={getScoreColor(state.weeklyFairnessScore)} />
            </View>
          </View>
          <ProgressBar progress={state.weeklyFairnessScore / 100} color={getScoreColor(state.weeklyFairnessScore)} height={10} />
          <Text style={styles.scoreHint}>Your average category completion vs your own targets</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statRow}>
          <StatCard icon="local-fire-department" value={`${state.streak.dailyStreak}d`} label="Best Streak" color={Colors.amber} />
          <StatCard icon="check-circle" value={String(state.allTimeCompletions)} label="Quests Done" color={Colors.success} />
          <StatCard icon="bolt" value={`${state.totalCharacterXp}`} label="Total XP" color={Colors.gold} />
        </View>

        {/* Best category callout */}
        {bestCat && (bestCategory?.completionPct || 0) > 0 && (
          <View style={styles.bestCard}>
            <MaterialIcons name="workspace-premium" size={20} color={Colors.gold} />
            <Text style={styles.bestText}>
              Strongest this week:{' '}
              <Text style={{ color: CategoryColors[bestCat.name] || Colors.gold, fontWeight: FontWeight.bold }}>
                {bestCat.name}
              </Text>{' '}
              at {Math.round(bestCategory?.completionPct || 0)}%
            </Text>
          </View>
        )}

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>

          {state.activeCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="layers" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Complete onboarding to see category progress.</Text>
            </View>
          ) : (
            state.activeCategories.map((ac) => {
              const cat = getCategoryById(ac.categoryId);
              if (!cat) return null;
              const score = state.weeklyCategoryScores.find((s) => s.categoryId === ac.categoryId);
              const pct = score?.completionPct || 0;
              const color = CategoryColors[cat.name] || Colors.gold;
              const earned = score?.earnedCredits || 0;
              const target = ac.weeklyTarget;

              return (
                <View key={ac.categoryId} style={styles.catCard}>
                  <View style={styles.catCardHeader}>
                    <View style={[styles.catIcon, { backgroundColor: color + '20' }]}>
                      <MaterialIcons name={cat.icon as any} size={22} color={color} />
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catCredits}>
                        {earned.toFixed(1)} / {target} credits
                        {pct >= 100 ? ' · Done!' : ''}
                      </Text>
                    </View>
                    <View style={[styles.pctPill, { backgroundColor: pct >= 80 ? Colors.successSoft : pct >= 40 ? Colors.goldSoft : Colors.surfaceBorder }]}>
                      <Text style={[styles.catPct, { color: pct >= 80 ? Colors.success : pct >= 40 ? Colors.gold : Colors.textSecondary }]}>
                        {Math.round(pct)}%
                      </Text>
                    </View>
                  </View>
                  <ProgressBar progress={pct / 100} color={color} height={6} />
                  <Text style={styles.catHint}>
                    {pct >= 100
                      ? 'Target reached. Extra completions still earn XP.'
                      : `${(target - earned).toFixed(1)} more credits to hit your target`}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            <View style={styles.badgeGrid}>
              {earnedBadges.map((b) => (
                <View key={b.id} style={styles.badgeCard}>
                  <View style={[styles.badgeIcon, { backgroundColor: Colors.goldSoft }]}>
                    <MaterialIcons name={b.icon as any} size={22} color={Colors.gold} />
                  </View>
                  <Text style={styles.badgeName}>{b.name}</Text>
                  <Text style={styles.badgeDesc}>{b.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Locked Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {earnedBadges.length === 0 ? 'Badges to Earn' : 'Next Badges'}
          </Text>
          <View style={styles.badgeGrid}>
            {lockedBadges.slice(0, 4).map((b) => (
              <View key={b.id} style={[styles.badgeCard, styles.badgeLocked]}>
                <View style={[styles.badgeIcon, { backgroundColor: Colors.surfaceElevated }]}>
                  <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
                </View>
                <Text style={[styles.badgeName, { color: Colors.textMuted }]}>{b.name}</Text>
                <Text style={[styles.badgeDesc, { color: Colors.textMuted }]}>{b.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={statStyles.card}>
      <MaterialIcons name={icon as any} size={20} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.xl, paddingBottom: Spacing.sm, gap: 2 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scroll: { padding: Spacing.xl, paddingTop: 0, gap: Spacing.lg },

  scoreCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  scoreTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  scoreLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  scoreValue: { fontSize: 42, fontWeight: FontWeight.heavy },
  scoreBadge: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  scoreHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  statRow: { flexDirection: 'row', gap: Spacing.sm },
  bestCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.gold + '30',
  },
  bestText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },

  section: { gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  catCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  catCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  catIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1 },
  catName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  catCredits: { fontSize: FontSize.sm, color: Colors.textSecondary },
  pctPill: { borderRadius: Radius.round, paddingHorizontal: 10, paddingVertical: 4 },
  catPct: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  catHint: { fontSize: FontSize.xs, color: Colors.textMuted },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeCard: {
    width: '47.5%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: 4, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  badgeLocked: { borderColor: Colors.surfaceBorder },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badgeName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  badgeDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },

  emptyState: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
