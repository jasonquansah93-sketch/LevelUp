import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { AvatarDisplay } from '@/components/feature/AvatarDisplay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PaywallModal } from '@/components/feature/PaywallModal';
import { getCategoryById } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors } from '@/constants/theme';

interface ProfileRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  color?: string;
  onPress: () => void;
  isPremiumGate?: boolean;
  isPremium?: boolean;
  chevron?: boolean;
  danger?: boolean;
}

function ProfileRow({ icon, label, subtitle, color, onPress, isPremiumGate, isPremium, chevron = true, danger }: ProfileRowProps) {
  const iconColor = danger ? Colors.error : (color || Colors.textSecondary);
  const showLock = isPremiumGate && !isPremium;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: Colors.errorSoft }]}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {showLock && (
        <View style={styles.premiumLockBadge}>
          <MaterialIcons name="workspace-premium" size={12} color={Colors.gold} />
          <Text style={styles.premiumLockText}>Pro</Text>
        </View>
      )}
      {chevron && <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, upgradeToPremium: authUpgrade } = useAuth();
  const { state, getXpInfo, upgradeToPremium } = useGame();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const xpInfo = getXpInfo();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handlePremiumAction = (action: () => void) => {
    if (!state.isPremium) { setPaywallVisible(true); return; }
    action();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <AvatarDisplay avatar={state.avatar} level={xpInfo.level} size="xl" />

          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{state.avatar.name || user?.displayName || 'Your Character'}</Text>
            <Text style={styles.heroEmail}>{user?.email}</Text>

            {state.isPremium ? (
              <View style={styles.premiumBadge}>
                <MaterialIcons name="workspace-premium" size={13} color={Colors.gold} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.upgradeBtn, pressed && styles.pressed]}
                onPress={() => setPaywallVisible(true)}
              >
                <MaterialIcons name="workspace-premium" size={14} color={Colors.textInverse} />
                <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
              </Pressable>
            )}
          </View>

          {/* XP progress */}
          <View style={styles.xpWrap}>
            <View style={styles.xpTopRow}>
              <Text style={styles.xpLabel}>Level {xpInfo.level}</Text>
              <Text style={styles.xpAmt}>{xpInfo.current} / {xpInfo.next} XP</Text>
            </View>
            <ProgressBar progress={xpInfo.progress} color={Colors.gold} height={7} />
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          {[
            { value: String(state.allTimeCompletions), label: 'Quests' },
            { value: String(state.totalCharacterXp), label: 'Total XP' },
            { value: `${state.streak.dailyStreak}d`, label: 'Streak' },
            { value: String(state.badges.length), label: 'Badges' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Active categories */}
        {state.activeCategories.length > 0 && (
          <View style={styles.catSection}>
            <Text style={styles.catSectionTitle}>Active Categories</Text>
            <View style={styles.catChips}>
              {state.activeCategories.map((ac) => {
                const cat = getCategoryById(ac.categoryId);
                if (!cat) return null;
                const color = CategoryColors[cat.name] || Colors.gold;
                return (
                  <View key={ac.categoryId} style={[styles.catChip, { borderColor: color + '50' }]}>
                    <MaterialIcons name={cat.icon as any} size={13} color={color} />
                    <Text style={[styles.catChipText, { color }]}>{cat.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Character Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Character</Text>
          <View style={styles.menuCard}>
            <ProfileRow
              icon="face"
              label="Edit Avatar"
              subtitle="Update your character look"
              onPress={() => Alert.alert('Edit Avatar', 'Avatar editor coming soon.')}
            />
            <View style={styles.rowDivider} />
            <ProfileRow
              icon="camera-alt"
              label="Regenerate from Photo"
              subtitle="AI-generate a new character version"
              isPremiumGate
              isPremium={state.isPremium}
              onPress={() => handlePremiumAction(() => Alert.alert('Regenerate', 'Photo-based generation coming soon.'))}
            />
          </View>
        </View>

        {/* My Plan Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>My Plan</Text>
          <View style={styles.menuCard}>
            <ProfileRow
              icon="apps"
              label="Manage Categories"
              subtitle={`${state.activeCategories.length} active`}
              onPress={() => Alert.alert('Categories', 'Category manager coming soon.')}
            />
            <View style={styles.rowDivider} />
            <ProfileRow
              icon="assignment"
              label="Manage Quests"
              subtitle={`${state.activeQuests.length} active quests`}
              onPress={() => Alert.alert('Quests', 'Quest manager coming soon.')}
            />
            <View style={styles.rowDivider} />
            <ProfileRow
              icon="workspace-premium"
              label="Subscription"
              subtitle={state.isPremium ? 'Premium — Active' : 'Free Plan · Upgrade for more'}
              color={Colors.gold}
              onPress={() => setPaywallVisible(true)}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>App</Text>
          <View style={styles.menuCard}>
            <ProfileRow
              icon="notifications-none"
              label="Notifications"
              subtitle="Reminders and alerts"
              onPress={() => Alert.alert('Notifications', 'Notification settings coming soon.')}
            />
            <View style={styles.rowDivider} />
            <ProfileRow
              icon="settings"
              label="Settings"
              subtitle="Account and preferences"
              onPress={() => Alert.alert('Settings', 'Settings coming soon.')}
            />
            <View style={styles.rowDivider} />
            <ProfileRow
              icon="help-outline"
              label="Help & Support"
              subtitle="Get help or send feedback"
              onPress={() => Alert.alert('Support', 'Contact: support@levelup.app')}
            />
          </View>
        </View>

        {/* Streak Savers */}
        <View style={styles.saverCard}>
          <View style={styles.saverLeft}>
            <MaterialIcons name="shield" size={20} color={Colors.info} />
            <View style={{ gap: 2 }}>
              <Text style={styles.saverTitle}>Streak Savers</Text>
              <Text style={styles.saverSub}>
                {state.streak.streakSaversAvailable} remaining
                {!state.isPremium ? ' · Premium adds 2/month' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.saverBadge}>
            <Text style={styles.saverBadgeText}>{state.streak.streakSaversAvailable}</Text>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.menuCard}>
          <ProfileRow icon="logout" label="Log Out" danger onPress={handleLogout} chevron={false} />
        </View>

        <Text style={styles.version}>LevelUp v1.0</Text>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUpgrade={() => { upgradeToPremium(); void authUpgrade(); setPaywallVisible(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },

  heroCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  heroInfo: { alignItems: 'center', gap: Spacing.sm, width: '100%' },
  heroName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  heroEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
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
  xpWrap: { width: '100%', gap: Spacing.xs },
  xpTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },
  xpAmt: { fontSize: FontSize.sm, color: Colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statBox: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },

  catSection: { gap: Spacing.sm },
  catSectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  catChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5,
  },
  catChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  menuSection: { gap: Spacing.sm },
  menuSectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  menuCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  rowPressed: { backgroundColor: Colors.surfaceHover },
  rowIcon: { width: 38, height: 38, borderRadius: Radius.sm, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rowSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  rowDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: Spacing.md + 38 + Spacing.md },
  premiumLockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.gold + '40',
    marginRight: Spacing.xs,
  },
  premiumLockText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },

  saverCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.infoSoft, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.info + '30',
  },
  saverLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  saverTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  saverSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  saverBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.info, alignItems: 'center', justifyContent: 'center',
  },
  saverBadgeText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },

  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
