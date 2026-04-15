/**
 * rewards.ts — MVP reward / boost layer
 *
 * All reward definitions and calculation helpers live here so they are
 * easy to inspect and extend later (home screen nudges, celebration UI,
 * push notifications, etc.).
 *
 * The existing quest XP / weekly credits / fairness system is NOT replaced.
 * This layer sits on top and adds bonus XP on qualifying events.
 */

// ─── COMBO REWARDS ───────────────────────────────────────────────────────────
// Awarded based on the total number of quest completions in a single calendar day.

export interface ComboReward {
  /** Minimum completions in one day needed to trigger this reward */
  threshold: number;
  /** Cumulative bonus XP awarded at this threshold (not incremental) */
  bonusXp: number;
  /** Human-readable label for UI display / celebration copy */
  label: string;
}

/**
 * Defined in ascending threshold order.
 * Only the highest matching threshold fires per day.
 * Capped at 3 completions — no further rewards for 4+.
 */
export const COMBO_REWARDS: ComboReward[] = [
  { threshold: 2, bonusXp: 10, label: 'Double Combo! +10 XP' },
  { threshold: 3, bonusXp: 20, label: 'Triple Combo! +20 XP' },
];

/**
 * Calculates the bonus XP earned for reaching `newCount` completions today.
 * Returns 0 if no threshold is newly crossed.
 *
 * @param prevCount  Total completions already logged today (before this one)
 * @param newCount   Total completions after adding the current one
 */
export function calcComboBonusXp(prevCount: number, newCount: number): number {
  let bonus = 0;
  for (const reward of COMBO_REWARDS) {
    const justCrossed = prevCount < reward.threshold && newCount >= reward.threshold;
    if (justCrossed) {
      bonus = reward.bonusXp; // Take the highest newly-crossed threshold
    }
  }
  return bonus;
}

/**
 * Returns the active combo reward for the given daily count, or null if none.
 * Useful for celebration UI lookups.
 */
export function getActiveComboReward(totalTodayCount: number): ComboReward | null {
  let matched: ComboReward | null = null;
  for (const reward of COMBO_REWARDS) {
    if (totalTodayCount >= reward.threshold) matched = reward;
  }
  return matched;
}

// ─── STREAK MILESTONES ────────────────────────────────────────────────────────
// All streak milestone definitions in one place. Edit here to adjust.

export interface StreakMilestone {
  /** Streak day count that triggers this milestone */
  day: number;
  /** Bonus XP awarded at this milestone */
  bonusXp: number;
  /** Short celebration title */
  title: string;
  /** Supporting description for UI */
  description: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { day: 3,   bonusXp: 25,  title: '3-Day Streak!',    description: 'You are building real momentum.' },
  { day: 7,   bonusXp: 50,  title: 'One Week Streak!', description: 'A full week — that is a real habit.' },
  { day: 10,  bonusXp: 75,  title: '10-Day Streak!',   description: 'Double digits. Keep going.' },
  { day: 14,  bonusXp: 100, title: 'Two Weeks Strong!', description: 'Two weeks of consistency — impressive.' },
  { day: 21,  bonusXp: 150, title: '21-Day Streak!',   description: 'Three weeks. Habits are forming deep.' },
  { day: 30,  bonusXp: 200, title: 'One Month!',        description: 'A full month of daily effort. Legendary.' },
  { day: 45,  bonusXp: 250, title: '45-Day Streak!',   description: 'Six weeks of relentless consistency.' },
  { day: 60,  bonusXp: 300, title: 'Two Months!',       description: 'Two months strong. You are elite.' },
  { day: 75,  bonusXp: 350, title: '75-Day Streak!',   description: 'The 75 Hard benchmark. Unstoppable.' },
  { day: 100, bonusXp: 500, title: '100-Day Streak!',  description: 'A hundred days. A true identity shift.' },
];

/**
 * Returns the streak milestone for an exact day count, or null if none.
 * Call this each time the streak increments.
 */
export function getStreakMilestone(streakDay: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.day === streakDay) ?? null;
}

// ─── WEEKLY CONSISTENCY REWARDS ──────────────────────────────────────────────
// Every completed 7-day streak block counts as a weekly consistency reward event.

export interface WeeklyConsistencyReward {
  /** Which week number (1-based) this reward is for */
  weekNumber: number;
  /** Bonus XP for completing this streak-week */
  bonusXp: number;
  /** Display title */
  title: string;
}

/**
 * Derives the weekly consistency reward from a streak day count.
 * A "streak week" completes every time the streak is an exact multiple of 7.
 * Returns null if the streak is not at a weekly boundary.
 */
export function getWeeklyConsistencyReward(streakDay: number): WeeklyConsistencyReward | null {
  if (streakDay <= 0 || streakDay % 7 !== 0) return null;
  const weekNumber = streakDay / 7;
  // Bonus XP scales with weeks: 50 × weekNumber, capped at 300
  const bonusXp = Math.min(50 * weekNumber, 300);
  return {
    weekNumber,
    bonusXp,
    title: `Week ${weekNumber} Complete!`,
  };
}

// ─── DAILY GRATIFICATION EVENT ───────────────────────────────────────────────
// Each new streak day (i.e. the first completion on a new calendar day) generates
// a trackable gratification event. No large XP per day — just a first-class event
// that future UI (animations, home screen badge, notification) can consume.

export interface DailyGratificationEvent {
  streakDay: number;
  date: string; // 'YYYY-MM-DD'
  /** Small daily XP bonus — 0 by default, non-zero on milestone days */
  bonusXp: number;
  /** True when this day coincides with a streak milestone */
  isMilestone: boolean;
  /** True when this day completes a weekly streak block */
  isWeekComplete: boolean;
}

/**
 * Builds a DailyGratificationEvent for the current streak day.
 * Call this when `lastCompletedDate !== today` (i.e. a new streak day started).
 */
export function buildDailyGratificationEvent(streakDay: number, date: string): DailyGratificationEvent {
  const milestone = getStreakMilestone(streakDay);
  const weekReward = getWeeklyConsistencyReward(streakDay);

  return {
    streakDay,
    date,
    bonusXp: milestone?.bonusXp ?? weekReward?.bonusXp ?? 0,
    isMilestone: milestone !== null,
    isWeekComplete: weekReward !== null,
  };
}
