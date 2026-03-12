import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { AvatarDisplay } from '@/components/feature/AvatarDisplay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PaywallModal } from '@/components/feature/PaywallModal';
import { getCategoryById } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { state, getXpInfo, upgradeToPremium } = useGame();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const xpInfo = getXpInfo();

  const MENU_ITEMS = [
    { icon: 'person-outline', label: 'Edit Avatar', sub: 'Customize your character look', action: () => {} },
    { icon: 'apps', label: 'Manage Categories', sub: `${state.activeCategories.length} active categories`, action: () => {} },
    { icon: 'assignment', label: 'Manage Quests', sub: `${state.activeQuests.length} active quests`, action: () => {} },
    { icon: 'workspace-premium', label: 'Subscription', sub: state.isPremium ? 'Premium — Active' : 'Free Plan', action: () => setPaywallVisible(true), isPremium: true },
    { icon: 'notifications-none', label: 'Notifications', sub: 'Reminders and alerts', action: () => {} },
    { icon: 'settings', label: 'Settings', sub: 'Account and preferences', action: () => {} },
    { icon: 'help-outline', label: 'Support', sub: 'Help and feedback', action: () => {} },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Avatar Hero */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            <AvatarDisplay avatar={state.avatar} level={xpInfo.level} size="xl" />
          </View>
          <Text style={styles.heroName}>{state.avatar.name || user?.displayName || 'Your Character'}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>

          {state.isPremium ? (
            <View style={styles.premiumBadge}>
              <MaterialIcons name="workspace-premium" size={14} color={Colors.gold} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          ) : (
            <Pressable style={styles.upgradeBtn} onPress={() => setPaywallVisible(true)}>
              <MaterialIcons name="workspace-premium" size={14} color={Colors.textInverse} />
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </Pressable>
          )}

          {/* XP Bar */}
          <View style={styles.xpWrap}>
            <View style={styles.xpTopRow}>
              <Text style={styles.xpLabel}>Level {xpInfo.level}</Text>
              <Text style={styles.xpAmt}>{xpInfo.current} / {xpInfo.next} XP</Text>
            </View>
            <ProgressBar progress={xpInfo.progress} color={Colors.gold} height={8} />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatMini value={String(state.allTimeCompletions)} label="Quests Done" />
          <StatMini value={String(state.totalCharacterXp)} label="Total XP" />
          <StatMini value={`${state.streak.dailyStreak}d`} label="Streak" />
          <StatMini value={`${state.badges.length}`} label="Badges" />
        </View>

        {/* Active Categories */}
        {state.activeCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Categories</Text>
            <View style={styles.catList}>
              {state.activeCategories.map((ac) => {
                const cat = getCategoryById(ac.categoryId);
                if (!cat) return null;
                const color = CategoryColors[cat.name] || Colors.gold;
                return (
                  <View key={ac.categoryId} style={[styles.catChip, { borderColor: color + '40' }]}>
                    <MaterialIcons name={cat.icon as any} size={14} color={color} />
                    <Text style={[styles.catChipText, { color }]}>{cat.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                pressed && styles.menuItemPressed,
              ]}
              onPress={item.action}
            >
              <View style={[styles.menuIcon, item.isPremium && !state.isPremium && { backgroundColor: Colors.goldSoft }]}>
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={item.isPremium && !state.isPremium ? Colors.gold : Colors.textSecondary}
                />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Streak Savers */}
        <View style={styles.saverCard}>
          <MaterialIcons name="shield" size={20} color={Colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.saverTitle}>Streak Savers Available</Text>
            <Text style={styles.saverSub}>
              {state.streak.streakSaversAvailable} saver{state.streak.streakSaversAvailable !== 1 ? 's' : ''} remaining
              {!state.isPremium ? ' · Premium adds 2/month' : ''}
            </Text>
          </View>
          <View style={styles.saverCount}>
            <Text style={styles.saverCountText}>{state.streak.streakSaversAvailable}</Text>
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          onPress={logout}
        >
          <MaterialIcons name="logout" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.version}>LevelUp v1.0 · Mock Mode</Text>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => {
          upgradeToPremium();
          setPaywallVisible(false);
        }}
      />
    </View>
  );
}

function StatMini({ value, label }: { value: string; label: string }) {
  return (
    <View style={miniStyles.card}>
      <Text style={miniStyles.value}>{value}</Text>
      <Text style={miniStyles.label}>{label}</Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },
  heroCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  avatarWrap: { marginBottom: Spacing.sm },
  heroName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  heroEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  premiumBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold, borderRadius: Radius.round,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  upgradeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },
  xpWrap: { width: '100%', gap: Spacing.xs, marginTop: Spacing.sm },
  xpTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },
  xpAmt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  catList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5,
  },
  catChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  menuCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  menuItemPressed: { backgroundColor: Colors.surfaceHover },
  menuIcon: { width: 38, height: 38, borderRadius: Radius.sm, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  menuSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  saverCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.infoSoft, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.info + '30',
  },
  saverTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  saverSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  saverCount: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.info,
    alignItems: 'center', justifyContent: 'center',
  },
  saverCountText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.errorSoft, borderRadius: Radius.md, height: 52,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.error },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted },
  pressed: { opacity: 0.85 },
});
