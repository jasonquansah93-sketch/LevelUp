/**
 * Streak Reminder Service — MVP
 *
 * Schedules up to 3 fixed local notification windows per day:
 *   1. Morning   — 08:00
 *   2. Afternoon — 18:00
 *   3. Evening   — 21:00
 *
 * Rules:
 *   - Only fires when remindersEnabled + streakReminderEnabled are true
 *   - Only fires when today's streak is NOT yet secured
 *   - Today's streak is secured when at least 1 quest is completed today
 *   - When secured, any pending same-day reminders are cancelled
 *
 * Persistence:
 *   - AsyncStorage tracks the last date reminders were scheduled to avoid
 *     re-scheduling the same day's windows on every app open.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEY_REMINDER_IDS = '@levelup_streak_reminder_ids';
const KEY_SECURED_DATE = '@levelup_streak_secured_date';
const KEY_SCHEDULED_DATE = '@levelup_reminders_scheduled_date';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduledIds {
  morning?: string;
  afternoon?: string;
  evening?: string;
}

// ─── Copy ────────────────────────────────────────────────────────────────────

const REMINDER_WINDOWS = [
  {
    key: 'morning' as const,
    hour: 8,
    minute: 0,
    title: 'Ready to start?',
    body: 'A small win today keeps your streak alive.',
  },
  {
    key: 'afternoon' as const,
    hour: 18,
    minute: 0,
    title: "Don't lose your streak",
    body: 'Complete one quest today to stay on track.',
  },
  {
    key: 'evening' as const,
    hour: 21,
    minute: 0,
    title: 'Last chance to keep it alive',
    body: "You're one quest away from protecting today's streak.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

async function loadScheduledIds(): Promise<ScheduledIds> {
  try {
    const raw = await AsyncStorage.getItem(KEY_REMINDER_IDS);
    if (!raw) return {};
    return JSON.parse(raw) as ScheduledIds;
  } catch {
    return {};
  }
}

async function saveScheduledIds(ids: ScheduledIds): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_REMINDER_IDS, JSON.stringify(ids));
  } catch { /* non-fatal */ }
}

async function loadScheduledDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_SCHEDULED_DATE);
  } catch {
    return null;
  }
}

async function saveScheduledDate(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_SCHEDULED_DATE, date);
  } catch { /* non-fatal */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Mark today as streak-secured and cancel any pending same-day reminders.
 * Call this immediately after the first quest completion of the day.
 */
export async function markStreakSecuredToday(): Promise<void> {
  const today = getTodayString();
  try {
    await AsyncStorage.setItem(KEY_SECURED_DATE, today);
  } catch { /* non-fatal */ }
  // Cancel pending same-day reminders
  await cancelTodayStreakReminders();
}

/**
 * Check whether today's streak has already been secured (i.e., at least 1 quest
 * was completed today). Used to gate reminder scheduling.
 */
export async function isTodayStreakSecured(): Promise<boolean> {
  try {
    const secured = await AsyncStorage.getItem(KEY_SECURED_DATE);
    return secured === getTodayString();
  } catch {
    return false;
  }
}

/**
 * Schedule streak-protection reminders for today's remaining windows.
 *
 * Safe to call on settings change or app foreground — will skip scheduling
 * if reminders are already scheduled for today, or if streak is already secured.
 *
 * @param force - Re-schedule even if already scheduled today (use on settings change)
 */
export async function scheduleStreakReminders(force = false): Promise<void> {
  try {
    const today = getTodayString();

    // Don't schedule if streak already secured today
    const secured = await isTodayStreakSecured();
    if (secured) return;

    // Don't re-schedule the same day unless forced
    const lastScheduledDate = await loadScheduledDate();
    if (!force && lastScheduledDate === today) return;

    // Cancel any existing reminders first to avoid duplicates
    await cancelTodayStreakReminders();

    const now = new Date();
    const newIds: ScheduledIds = {};

    for (const window of REMINDER_WINDOWS) {
      const triggerDate = new Date();
      triggerDate.setHours(window.hour, window.minute, 0, 0);

      // Skip windows that are already past for today
      if (triggerDate <= now) continue;

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: window.title,
            body: window.body,
            sound: true,
            data: { type: 'streak_reminder', window: window.key },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
        newIds[window.key] = id;
      } catch { /* skip failed window — non-fatal */ }
    }

    await saveScheduledIds(newIds);
    await saveScheduledDate(today);
  } catch { /* non-fatal — don't break app if scheduling fails */ }
}

/**
 * Cancel all pending streak reminder notifications scheduled for today.
 * Called when:
 *   - The user secures today's streak (quest completed)
 *   - The user disables reminders or streak protection
 */
export async function cancelTodayStreakReminders(): Promise<void> {
  try {
    const ids = await loadScheduledIds();
    const pending = Object.values(ids).filter(Boolean) as string[];
    for (const id of pending) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch { /* already fired or not found — safe to ignore */ }
    }
    await saveScheduledIds({});
  } catch { /* non-fatal */ }
}

/**
 * Cancel all streak reminders and clear scheduling state.
 * Call when reminders or streak protection is toggled off.
 */
export async function disableAllStreakReminders(): Promise<void> {
  await cancelTodayStreakReminders();
  try {
    await AsyncStorage.removeItem(KEY_SCHEDULED_DATE);
  } catch { /* non-fatal */ }
}
