import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { PaywallModal } from '@/components/feature/PaywallModal';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const DEMO_FRIENDS = [
  { id: '1', name: 'Jordan K.', score: 94, streak: 18, bestCat: 'Fitness' },
  { id: '2', name: 'Sam R.', score: 87, streak: 12, bestCat: 'Focus' },
  { id: '3', name: 'Casey M.', score: 61, streak: 5, bestCat: 'Learning' },
  { id: '4', name: 'Riley T.', score: 52, streak: 3, bestCat: 'Sleep' },
];

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return String(Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7));
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { state } = useGame();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const userScore = Math.round(state.weeklyFairnessScore);
  const userStreak = state.streak.dailyStreak;

  const myEntry = {
    id: 'me',
    name: user?.displayName || 'You',
    score: userScore,
    streak: userStreak,
    bestCat: 'You',
    isMe: true,
  };

  const allEntries = [
    ...DEMO_FRIENDS.map((f) => ({ ...f, isMe: false })),
    myEntry,
  ].sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));

  const myRank = allEntries.find((e) => e.isMe)?.rank || '-';
  const topThree = allEntries.slice(0, 3);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Week {getWeekLabel()}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* My rank card */}
        <View style={styles.myRankCard}>
          <View style={styles.myRankLeft}>
            <Text style={styles.myRankNum}>#{myRank}</Text>
            <Text style={styles.myRankLabel}>Your rank this week</Text>
          </View>
          <View style={styles.myRankScores}>
            <View style={styles.myRankScore}>
              <Text style={styles.myRankScoreValue}>{userScore}%</Text>
              <Text style={styles.myRankScoreLabel}>Score</Text>
            </View>
            <View style={styles.myRankDivider} />
            <View style={styles.myRankScore}>
              <Text style={styles.myRankScoreValue}>{userStreak}d</Text>
              <Text style={styles.myRankScoreLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Fairness banner */}
        <View style={styles.fairnessBanner}>
          <MaterialIcons name="balance" size={16} color={Colors.info} />
          <Text style={styles.fairnessText}>
            Rankings use Fairness Score — your completion vs your own target. Always fair, regardless of categories chosen.
          </Text>
        </View>

        {/* Podium */}
        <View style={styles.podium}>
          {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry, idx) => {
            const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const rankColors: Record<number, string> = { 1: '#F5C842', 2: '#C0C0C0', 3: '#CD7F32' };
            const color = entry.isMe ? Colors.gold : (rankColors[entry.rank] || Colors.textSecondary);
            const heights: Record<number, number> = { 1: 88, 2: 66, 3: 52 };
            const height = heights[entry.rank] || 52;
            return (
              <View key={entry.id} style={[styles.podiumSlot, entry.isMe && styles.podiumMe]}>
                <View style={[styles.podiumAvatar, { borderColor: color + '60' }]}>
                  <MaterialIcons name="person" size={26} color={color} />
                  <View style={[styles.podiumRankBadge, { backgroundColor: color }]}>
                    <Text style={styles.podiumRankText}>{entry.rank}</Text>
                  </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{entry.isMe ? 'You' : entry.name}</Text>
                <Text style={[styles.podiumScore, { color }]}>{entry.score}%</Text>
                <View style={[styles.podiumBar, { height, backgroundColor: color + 'CC' }]} />
              </View>
            );
          })}
        </View>

        {/* Full list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Rankings</Text>
          {allEntries.map((entry) => {
            const rankColors: Record<number, string> = { 1: '#F5C842', 2: '#C0C0C0', 3: '#CD7F32' };
            const rankColor = rankColors[entry.rank] || Colors.textSecondary;
            return (
              <View key={entry.id} style={[styles.entryRow, entry.isMe && styles.entryMe]}>
                <Text style={[styles.entryRank, entry.rank <= 3 && { color: rankColor }]}>
                  #{entry.rank}
                </Text>
                <View style={[styles.entryAvatar, { backgroundColor: entry.isMe ? Colors.goldSoft : Colors.surface }]}>
                  <MaterialIcons name="person" size={22} color={entry.isMe ? Colors.gold : Colors.textSecondary} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, entry.isMe && { color: Colors.gold }]}>
                    {entry.isMe ? user?.displayName || 'You' : entry.name}
                  </Text>
                  <View style={styles.entryMeta}>
                    <MaterialIcons name="local-fire-department" size={11} color={Colors.amber} />
                    <Text style={styles.entryStreakText}>{entry.streak}d streak</Text>
                    {!entry.isMe && (
                      <>
                        <Text style={styles.entryDot}>·</Text>
                        <Text style={styles.entryBestCat}>{entry.bestCat}</Text>
                      </>
                    )}
                  </View>
                </View>
                <Text style={[styles.entryScore, { color: entry.rank <= 3 ? rankColor : Colors.textPrimary }]}>
                  {entry.score}%
                </Text>
              </View>
            );
          })}
        </View>

        {/* Invite */}
        <Pressable
          style={({ pressed }) => [styles.inviteCard, pressed && styles.pressed]}
          onPress={() => {}}
        >
          <View style={styles.inviteIcon}>
            <MaterialIcons name="group-add" size={22} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Invite Friends</Text>
            <Text style={styles.inviteSub}>Challenge your network to a fair weekly ranking.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        trigger="Unlock deeper analytics and premium avatar styles."
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => setPaywallVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.xl, paddingBottom: Spacing.sm, gap: 2 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scroll: { padding: Spacing.xl, paddingTop: 0, gap: Spacing.lg },

  myRankCard: {
    backgroundColor: Colors.goldSoft, borderRadius: Radius.xl, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  myRankLeft: { gap: 2 },
  myRankNum: { fontSize: 36, fontWeight: FontWeight.heavy, color: Colors.gold },
  myRankLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  myRankScores: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  myRankScore: { alignItems: 'center', gap: 2 },
  myRankScoreValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  myRankScoreLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  myRankDivider: { width: 1, height: 32, backgroundColor: Colors.surfaceBorder },

  fairnessBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.infoSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.info + '30',
  },
  fairnessText: { fontSize: FontSize.sm, color: Colors.info, flex: 1, lineHeight: 18 },

  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: Spacing.md, paddingBottom: Spacing.sm },
  podiumSlot: { alignItems: 'center', flex: 1, gap: Spacing.xs },
  podiumMe: {},
  podiumAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  podiumRankBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  podiumRankText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#000' },
  podiumName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },
  podiumScore: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  podiumBar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  entryMe: { borderColor: Colors.gold + '50', backgroundColor: Colors.goldSoft },
  entryRank: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted, width: 30 },
  entryAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  entryInfo: { flex: 1, gap: 2 },
  entryName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryStreakText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  entryDot: { fontSize: FontSize.xs, color: Colors.textMuted },
  entryBestCat: { fontSize: FontSize.xs, color: Colors.textMuted },
  entryScore: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  inviteCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.gold + '30',
  },
  inviteIcon: {
    width: 46, height: 46, borderRadius: Radius.md,
    backgroundColor: Colors.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  inviteTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  inviteSub: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
