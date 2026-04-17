/**
 * Notifications settings screen — MVP
 *
 * Controls:
 *   - Reminders master toggle
 *   - Protect my streak toggle
 *   - Static info row explaining the 3 fixed daily reminder windows
 *
 * Reminder windows (fixed, local):
 *   08:00 — Morning
 *   18:00 — Afternoon
 *   21:00 — Evening
 *
 * Permission:
 *   - Requested only when user explicitly enables a toggle (not on screen open)
 *   - Graceful fallback if denied — shows guidance to system settings
 *
 * Persistence:
 *   - AsyncStorage — survives app restarts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  scheduleStreakReminders,
  disableAllStreakReminders,
} from '@/services/streakReminders';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = '@levelup_notification_settings';

interface NotificationSettings {
  remindersEnabled: boolean;
  streakReminderEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  remindersEnabled: false,
  streakReminderEnabled: false,
};

async function loadSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    // Migrate old settings — drop reminderHour/reminderMinute safely
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      remindersEnabled: Boolean(parsed.remindersEnabled),
      streakReminderEnabled: Boolean(parsed.streakReminderEnabled),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(s: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* non-fatal */ }
}

// ─── Permission helpers ───────────────────────────────────────────────────────

type PermStatus = 'granted' | 'denied' | 'undetermined';

async function getPermissionStatus(): Promise<PermStatus> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as PermStatus;
  } catch {
    return 'undetermined';
  }
}

async function requestPermission(): Promise<PermStatus> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status as PermStatus;
  } catch {
    return 'denied';
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permStatus, setPermStatus] = useState<PermStatus>('undetermined');
  const [loading, setLoading] = useState(true);

  // Load persisted settings + current permission status on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSettings(), getPermissionStatus()]).then(([s, perm]) => {
      if (!cancelled) {
        setSettings(s);
        setPermStatus(perm);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((updated: NotificationSettings) => {
    setSettings(updated);
    void saveSettings(updated);
  }, []);

  // Request permission when user turns on a toggle — not on screen open
  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (permStatus === 'granted') return true;

    if (permStatus === 'denied') {
      Alert.alert(
        'Notifications are off',
        'To receive reminders, enable notifications for LevelUp in your device settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]
      );
      return false;
    }

    // undetermined — request
    const result = await requestPermission();
    setPermStatus(result);
    if (result === 'denied') {
      Alert.alert(
        'Reminders blocked',
        "We couldn't enable reminders. You can turn them on later in your device settings.",
        [{ text: 'OK' }]
      );
      return false;
    }
    return result === 'granted';
  }, [permStatus]);

  const handleRemindersToggle = useCallback(async (value: boolean) => {
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return;
      // Enabling master reminders — also enable streak protection by default
      const updated: NotificationSettings = { remindersEnabled: true, streakReminderEnabled: settings.streakReminderEnabled };
      persist(updated);
      if (updated.streakReminderEnabled) {
        void scheduleStreakReminders(true);
      }
    } else {
      // Disabling master reminders — also disable streak reminder and cancel all
      const updated: NotificationSettings = { remindersEnabled: false, streakReminderEnabled: false };
      persist(updated);
      void disableAllStreakReminders();
    }
  }, [settings, ensurePermission, persist]);

  const handleStreakToggle = useCallback(async (value: boolean) => {
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return;
      // Auto-enable master reminders if turning on streak protection
      const updated: NotificationSettings = { remindersEnabled: true, streakReminderEnabled: true };
      persist(updated);
      void scheduleStreakReminders(true);
    } else {
      const updated: NotificationSettings = { ...settings, streakReminderEnabled: false };
      persist(updated);
      void disableAllStreakReminders();
    }
  }, [settings, ensurePermission, persist]);

  if (loading) return <View style={styles.container} />;

  const permDenied = permStatus === 'denied';
  const permGranted = permStatus === 'granted';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxl }]}
      >

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <MaterialIcons name="local-fire-department" size={22} color={Colors.amber} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.infoTitle}>Stay consistent</Text>
            <Text style={styles.infoBody}>
              Turn on reminders so you don't miss a day and lose your streak.
            </Text>
          </View>
        </View>

        {/* Permission status — denied */}
        {permDenied && (
          <Pressable
            style={styles.permBanner}
            onPress={() => void Linking.openSettings()}
          >
            <MaterialIcons name="notifications-off" size={18} color={Colors.error} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.permBannerTitle}>Notifications are off</Text>
              <Text style={styles.permBannerSub}>Tap to open Settings and enable them.</Text>
            </View>
            <MaterialIcons name="open-in-new" size={16} color={Colors.error} />
          </Pressable>
        )}

        {/* Permission status — granted */}
        {permGranted && (
          <View style={styles.permGranted}>
            <MaterialIcons name="check-circle" size={16} color={Colors.success} />
            <Text style={styles.permGrantedText}>Notifications allowed</Text>
          </View>
        )}

        {/* Reminders section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Protection</Text>
          <View style={styles.card}>

            {/* Master reminders toggle */}
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.goldSoft }]}>
                <MaterialIcons name="notifications" size={20} color={Colors.gold} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Reminders</Text>
                <Text style={styles.settingSub}>Get helpful nudges to stay on track</Text>
              </View>
              <Switch
                value={settings.remindersEnabled}
                onValueChange={(v) => void handleRemindersToggle(v)}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.gold + 'AA' }}
                thumbColor={settings.remindersEnabled ? Colors.gold : Colors.textMuted}
                ios_backgroundColor={Colors.surfaceBorder}
              />
            </View>

            <View style={styles.rowDivider} />

            {/* Streak protection toggle */}
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.infoSoft }]}>
                <MaterialIcons name="shield" size={20} color={Colors.info} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Protect my streak</Text>
                <Text style={styles.settingSub}>Get reminded before you miss a day</Text>
              </View>
              <Switch
                value={settings.streakReminderEnabled}
                onValueChange={(v) => void handleStreakToggle(v)}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.info + 'AA' }}
                thumbColor={settings.streakReminderEnabled ? Colors.info : Colors.textMuted}
                ios_backgroundColor={Colors.surfaceBorder}
              />
            </View>

            <View style={styles.rowDivider} />

            {/* Static reminder windows info row */}
            <View style={[styles.settingRow, !settings.remindersEnabled && styles.rowDimmed]}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.surfaceElevated }]}>
                <MaterialIcons name="schedule" size={20} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Reminder windows</Text>
                <Text style={styles.settingSub}>
                  Morning, afternoon, and evening reminders may be sent until your streak is secured.
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* How it works card */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How streak reminders work</Text>
          <View style={styles.howRows}>
            {[
              { icon: 'wb-sunny', time: '8:00 AM', label: 'Morning nudge' },
              { icon: 'wb-cloudy', time: '6:00 PM', label: 'Afternoon reminder' },
              { icon: 'nights-stay', time: '9:00 PM', label: 'Evening last chance' },
            ].map((r) => (
              <View key={r.time} style={styles.howRow}>
                <MaterialIcons name={r.icon as any} size={15} color={Colors.gold} />
                <Text style={styles.howTime}>{r.time}</Text>
                <Text style={styles.howLabel}>{r.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.howDivider} />
          <View style={styles.howNote}>
            <MaterialIcons name="check-circle" size={14} color={Colors.success} />
            <Text style={styles.howNoteText}>
              Once you complete a quest, all remaining reminders for that day stop automatically.
            </Text>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <MaterialIcons name="info-outline" size={15} color={Colors.textMuted} />
          <Text style={styles.tipText}>
            Reminders are only sent on days when your streak isn't yet protected. Complete a quest early to silence them.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.bg,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  scroll: { padding: Spacing.xl, gap: Spacing.md },

  // Info card
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  infoTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  infoBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Permission banners
  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.errorSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.error + '30',
  },
  permBannerTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.error },
  permBannerSub: { fontSize: FontSize.xs, color: Colors.error + 'CC' },
  permGranted: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.successSoft, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '30',
  },
  permGrantedText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.success },

  // Section
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden',
    ...Shadows.sm,
  },

  // Setting rows
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
  },
  rowDimmed: { opacity: 0.45 },
  settingIcon: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  settingContent: { flex: 1, gap: 2 },
  settingLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  settingSub: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  rowDivider: {
    height: 1, backgroundColor: Colors.surfaceBorder,
    marginLeft: Spacing.md + 40 + Spacing.md,
  },

  // How it works card
  howCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: Spacing.md, gap: Spacing.sm,
    ...Shadows.sm,
  },
  howTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  howRows: { gap: Spacing.sm },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  howTime: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, width: 64 },
  howLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  howDivider: { height: 1, backgroundColor: Colors.surfaceBorder },
  howNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  howNoteText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, flex: 1 },

  // Tip
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md,
  },
  tipText: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18, flex: 1 },
});
