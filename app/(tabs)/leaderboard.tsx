import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { PaywallModal } from '@/components/feature/PaywallModal';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';

// Demo leaderboard data (mocked)
const DEMO_ENTRIES = [
  { rank: 1, name: 'Jordan K.', score: 94, streak: 18, isYou: false },
  { rank: 2, name: 'Sam R.', score: 87, streak: 12, isYou: false },
  { rank: 3, name: 'You', score: 0, streak: 0, isYou: true },
  { rank: 4, name: 'Casey M.', score: 61, streak: 5, isYou: false },
  { rank: 5, name: 'Riley T.', score: 52, streak: 3, isYou: false },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { state } = useGame();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const isPremium = state.isPremium;
  const userScore = Math.round(state.weeklyFairnessScore);
  const userStreak = state.streak.dailyStreak;

  const entries = DEMO_ENTRIES.map((e) =>
    e.isYou ? { ...e, name: user?.displayName || 'You', score: userScore, streak: userStreak } : e
  ).sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));

  const handleLeaderboardAccess = () => {
    if (!isPremium) {
      setPaywallVisible(true);
    }
  };

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Week {getWeekLabel()}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Fairness Banner */}
        <View style={styles.fairnessBanner}>
          <MaterialIcons name="balance" size={18} color={Colors.info} />
          <Text style={styles.fairnessText}>
            Rankings use Fairness Score — your average category completion vs your own targets.
          </Text>
        </View>

        {/* Premium Lock Overlay */}
        {!isPremium && (
          <Pressable style={styles.lockOverlay} onPress={handleLeaderboardAccess}>
            <View style={styles.lockCard}>
              <MaterialIcons name="lock" size={40} color={Colors.gold} />
              <Text style={styles.lockTitle}>Unlock Leaderboard</Text>
              <Text style={styles.lockSubtitle}>
                Compare your weekly Fairness Score with friends. Premium feature.
              </Text>
              <View style={styles.lockBtn}>
                <MaterialIcons name="workspace-premium" size={16} color={Colors.textInverse} />
                <Text style={styles.lockBtnText}>Upgrade to Premium</Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Podium */}
        <View style={styles.podium}>
          {topThree.map((entry) => {
            const rankColors = ['#F5C842', '#C0C0C0', '#CD7F32'];
            const color = rankColors[entry.rank - 1] || Colors.textSecondary;
            const height = entry.rank === 1 ? 90 : entry.rank === 2 ? 70 : 55;
            return (
              <View key={entry.rank} style={[styles.podiumSlot, entry.isYou && styles.podiumYou]}>
                <View style={styles.podiumAvatar}>
                  <MaterialIcons name="person" size={28} color={color} />
                  <View style={[styles.podiumRankBadge, { backgroundColor: color }]}>
                    <Text style={styles.podiumRankText}>{entry.rank}</Text>
                  </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{entry.isYou ? 'You' : entry.name}</Text>
                <Text style={[styles.podiumScore, { color }]}>{entry.score}%</Text>
                <View style={[styles.podiumBar, { height, backgroundColor: color + (isPremium ? 'CC' : '30') }]} />
              </View>
            );
          })}
        </View>

        {/* List */}
        <View style={styles.listSection}>
          {entries.map((entry) => {
            const isTop3 = entry.rank <= 3;
            const rankColors: Record<number, string> = { 1: '#F5C842', 2: '#C0C0C0', 3: '#CD7F32' };
            const rankColor = rankColors[entry.rank] || Colors.textSecondary;
            return (
              <View key={entry.rank} style={[styles.entryRow, entry.isYou && styles.entryYou]}>
                <Text style={[styles.entryRank, isTop3 && { color: rankColor }]}>#{entry.rank}</Text>
                <View style={[styles.entryAvatar, { backgroundColor: entry.isYou ? Colors.goldSoft : Colors.surface }]}>
                  <MaterialIcons name="person" size={22} color={entry.isYou ? Colors.gold : Colors.textSecondary} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryName}>{entry.isYou ? (user?.displayName || 'You') : entry.name}</Text>
                  <View style={styles.entryMeta}>
                    <MaterialIcons name="local-fire-department" size={12} color={Colors.amber} />
                    <Text style={styles.entryStreakText}>{isPremium ? entry.streak : '?'} day streak</Text>
                  </View>
                </View>
                <Text style={[styles.entryScore, { color: isPremium ? rankColor || Colors.textPrimary : Colors.textMuted }]}>
                  {isPremium ? `${entry.score}%` : '—'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Invite CTA */}
        <View style={styles.inviteCard}>
          <MaterialIcons name="group-add" size={24} color={Colors.gold} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.inviteTitle}>Invite Friends</Text>
            <Text style={styles.inviteSubtitle}>Challenge your network. Rankings are always fair.</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.inviteBtn, pressed && styles.pressed]}
            onPress={() => !isPremium && setPaywallVisible(true)}
          >
            <Text style={styles.inviteBtnText}>Invite</Text>
          </Pressable>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        trigger="Unlock leaderboard, friend comparison, and streak visibility."
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => { setPaywallVisible(false); }}
      />
    </View>
  );
}

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return String(Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.xl, paddingBottom: Spacing.md, gap: 2 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scroll: { padding: Spacing.xl, paddingTop: 0, gap: Spacing.lg },
  fairnessBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.infoSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.info + '30',
  },
  fairnessText: { fontSize: FontSize.sm, color: Colors.info, flex: 1, lineHeight: 18 },
  lockOverlay: { marginBottom: Spacing.sm },
  lockCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.gold + '30', ...Shadows.md,
  },
  lockTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  lockSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  lockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginTop: Spacing.sm,
  },
  lockBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textInverse },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: Spacing.md, paddingBottom: Spacing.md },
  podiumSlot: { alignItems: 'center', flex: 1, gap: Spacing.xs },
  podiumYou: {},
  podiumAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  podiumRankBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  podiumRankText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textInverse },
  podiumName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },
  podiumScore: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  podiumBar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  listSection: { gap: Spacing.sm },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  entryYou: { borderColor: Colors.gold + '50', backgroundColor: Colors.goldSoft },
  entryRank: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textMuted, width: 30 },
  entryAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  entryInfo: { flex: 1, gap: 2 },
  entryName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryStreakText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  entryScore: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  inviteCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.gold + '30',
  },
  inviteTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  inviteSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  inviteBtn: {
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  inviteBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
