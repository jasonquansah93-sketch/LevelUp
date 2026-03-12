import React, { createContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/template';
import { CATEGORIES, QUEST_TEMPLATES, getXpProgress } from '@/constants/gameData';
import { AuthContext } from '@/contexts/AuthContext';

export interface AvatarConfig {
  genderPresentation: string;
  skinTone: string;
  hairstyle: string;
  clothingStyle: string;
  bodyType: string;
  name: string;
}

export interface ActiveCategory {
  categoryId: string;
  intensity: 'light' | 'standard' | 'focused';
  weeklyTarget: number;
}

export interface ActiveQuest {
  questId: string;
  categoryId: string;
  name: string;
  characterXp: number;
  weeklyCredits: number;
  difficulty: string;
}

export interface QuestCompletion {
  questId: string;
  categoryId: string;
  characterXp: number;
  weeklyCredits: number;
  completedAt: string;
}

export interface WeeklyCategoryScore {
  categoryId: string;
  earnedCredits: number;
  targetCredits: number;
  completionPct: number;
}

export interface StreakData {
  dailyStreak: number;
  strongStreak: number;
  lastCompletedDate: string | null;
  categoriesCompletedToday: string[];
  streakSaversAvailable: number;
}

export interface GameState {
  avatar: AvatarConfig;
  activeCategories: ActiveCategory[];
  activeQuests: ActiveQuest[];
  totalCharacterXp: number;
  weeklyCompletions: QuestCompletion[];
  allTimeCompletions: number;
  weeklyCategoryScores: WeeklyCategoryScore[];
  weeklyFairnessScore: number;
  streak: StreakData;
  badges: string[];
  weekStartDate: string;
  isPremium: boolean;
}

interface GameContextType {
  state: GameState;
  isLoading: boolean;
  setAvatar: (avatar: AvatarConfig) => Promise<void>;
  setActiveCategories: (categories: ActiveCategory[]) => Promise<void>;
  setActiveQuests: (quests: ActiveQuest[]) => Promise<void>;
  completeQuest: (questId: string) => Promise<QuestCompletion | null>;
  useStreakSaver: () => Promise<boolean>;
  upgradeToPremium: () => void;
  resetWeek: () => void;
  getXpInfo: () => { level: number; current: number; next: number; progress: number };
  getTodayCompletions: () => QuestCompletion[];
  getCategoryScore: (categoryId: string) => WeeklyCategoryScore;
}

const DEFAULT_AVATAR: AvatarConfig = {
  genderPresentation: 'neutral',
  skinTone: 'tone2',
  hairstyle: 'short',
  clothingStyle: 'casual',
  bodyType: 'average',
  name: 'Your Character',
};

const DEFAULT_STREAK: StreakData = {
  dailyStreak: 0,
  strongStreak: 0,
  lastCompletedDate: null,
  categoriesCompletedToday: [],
  streakSaversAvailable: 2,
};

const INITIAL_STATE: GameState = {
  avatar: DEFAULT_AVATAR,
  activeCategories: [],
  activeQuests: [],
  totalCharacterXp: 0,
  weeklyCompletions: [],
  allTimeCompletions: 0,
  weeklyCategoryScores: [],
  weeklyFairnessScore: 0,
  streak: DEFAULT_STREAK,
  badges: [],
  weekStartDate: getWeekStart(),
  isPremium: false,
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function computeCategoryScores(
  activeCategories: ActiveCategory[],
  weeklyCompletions: QuestCompletion[]
): { scores: WeeklyCategoryScore[]; fairnessScore: number } {
  const scores: WeeklyCategoryScore[] = activeCategories.map((ac) => {
    const earned = weeklyCompletions
      .filter((c) => c.categoryId === ac.categoryId)
      .reduce((sum, c) => sum + c.weeklyCredits, 0);
    const completionPct = ac.weeklyTarget > 0
      ? Math.min((earned / ac.weeklyTarget) * 100, 100) : 0;
    return { categoryId: ac.categoryId, earnedCredits: earned, targetCredits: ac.weeklyTarget, completionPct };
  });

  const fairnessScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s.completionPct, 0) / scores.length : 0;

  return { scores, fairnessScore };
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const auth = React.useContext(AuthContext);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const loadedForUser = useRef<string | null>(null);

  const supabase = getSupabaseClient();

  // Reload game data whenever auth user changes
  useEffect(() => {
    const userId = auth?.session?.user?.id || null;
    if (userId && userId !== loadedForUser.current) {
      loadedForUser.current = userId;
      loadGameData(userId);
    } else if (!userId && loadedForUser.current) {
      loadedForUser.current = null;
      setState(INITIAL_STATE);
      setIsLoading(false);
    } else if (!userId) {
      setIsLoading(false);
    }
  }, [auth?.session?.user?.id]);

  const loadGameData = async (userId: string) => {
    setIsLoading(true);
    try {
      const [
        avatarRes,
        categoriesRes,
        questsRes,
        metaRes,
        streakRes,
        badgesRes,
      ] = await Promise.all([
        supabase.from('user_avatars').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_active_categories').select('*').eq('user_id', userId),
        supabase.from('user_active_quests').select('*').eq('user_id', userId),
        supabase.from('user_game_meta').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId),
      ]);

      const currentWeekStart = getWeekStart();

      // Load current week completions
      const { data: completionsData } = await supabase
        .from('quest_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', currentWeekStart + 'T00:00:00.000Z')
        .order('completed_at', { ascending: false });

      const avatar: AvatarConfig = avatarRes.data ? {
        genderPresentation: avatarRes.data.gender_presentation,
        skinTone: avatarRes.data.skin_tone,
        hairstyle: avatarRes.data.hairstyle,
        clothingStyle: avatarRes.data.clothing_style,
        bodyType: avatarRes.data.body_type,
        name: avatarRes.data.name,
      } : DEFAULT_AVATAR;

      const activeCategories: ActiveCategory[] = (categoriesRes.data || []).map((r: any) => ({
        categoryId: r.category_id,
        intensity: r.intensity,
        weeklyTarget: parseFloat(r.weekly_target),
      }));

      const activeQuests: ActiveQuest[] = (questsRes.data || []).map((r: any) => ({
        questId: r.quest_id,
        categoryId: r.category_id,
        name: r.name,
        characterXp: r.character_xp,
        weeklyCredits: parseFloat(r.weekly_credits),
        difficulty: r.difficulty,
      }));

      const weeklyCompletions: QuestCompletion[] = (completionsData || []).map((r: any) => ({
        questId: r.quest_id,
        categoryId: r.category_id,
        characterXp: r.character_xp,
        weeklyCredits: parseFloat(r.weekly_credits),
        completedAt: r.completed_at,
      }));

      const meta = metaRes.data;
      const streakRow = streakRes.data;

      // Check if streak needs resetting
      const today = getTodayString();
      let streakData: StreakData = {
        dailyStreak: streakRow?.daily_streak || 0,
        strongStreak: streakRow?.strong_streak || 0,
        lastCompletedDate: streakRow?.last_completed_date || null,
        categoriesCompletedToday: streakRow?.categories_completed_today || [],
        streakSaversAvailable: streakRow?.streak_savers_available ?? 2,
      };

      // If today's date doesn't match last completed and it's a new day, reset today's cats
      if (streakData.lastCompletedDate !== today) {
        streakData = { ...streakData, categoriesCompletedToday: [] };
      }

      // Check if streak is broken (more than 1 day gap without saver)
      if (streakData.lastCompletedDate) {
        const last = new Date(streakData.lastCompletedDate);
        const now = new Date(today);
        const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);
        if (diffDays > 1) {
          streakData = { ...streakData, dailyStreak: 0, strongStreak: 0 };
        }
      }

      const badges: string[] = (badgesRes.data || []).map((r: any) => r.badge_id);

      const { scores, fairnessScore } = computeCategoryScores(activeCategories, weeklyCompletions);

      setState({
        avatar,
        activeCategories,
        activeQuests,
        totalCharacterXp: meta?.total_character_xp || 0,
        weeklyCompletions,
        allTimeCompletions: meta?.all_time_completions || 0,
        weeklyCategoryScores: scores,
        weeklyFairnessScore: fairnessScore,
        streak: streakData,
        badges,
        weekStartDate: currentWeekStart,
        isPremium: meta?.is_premium || false,
      });
    } catch (e) {
      console.error('loadGameData error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserId = (): string | null => auth?.session?.user?.id || null;

  const setAvatar = async (avatar: AvatarConfig) => {
    const userId = getUserId();
    setState((prev) => ({ ...prev, avatar }));
    if (!userId) return;
    await supabase.from('user_avatars').upsert({
      user_id: userId,
      gender_presentation: avatar.genderPresentation,
      skin_tone: avatar.skinTone,
      hairstyle: avatar.hairstyle,
      clothing_style: avatar.clothingStyle,
      body_type: avatar.bodyType,
      name: avatar.name,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  };

  const setActiveCategories = async (categories: ActiveCategory[]) => {
    const userId = getUserId();
    const { scores, fairnessScore } = computeCategoryScores(categories, state.weeklyCompletions);
    setState((prev) => ({
      ...prev,
      activeCategories: categories,
      weeklyCategoryScores: scores,
      weeklyFairnessScore: fairnessScore,
    }));
    if (!userId) return;
    // Delete existing and re-insert
    await supabase.from('user_active_categories').delete().eq('user_id', userId);
    if (categories.length > 0) {
      await supabase.from('user_active_categories').insert(
        categories.map((c) => ({
          user_id: userId,
          category_id: c.categoryId,
          intensity: c.intensity,
          weekly_target: c.weeklyTarget,
        }))
      );
    }
  };

  const setActiveQuests = async (quests: ActiveQuest[]) => {
    const userId = getUserId();
    setState((prev) => ({ ...prev, activeQuests: quests }));
    if (!userId) return;
    await supabase.from('user_active_quests').delete().eq('user_id', userId);
    if (quests.length > 0) {
      await supabase.from('user_active_quests').insert(
        quests.map((q) => ({
          user_id: userId,
          quest_id: q.questId,
          category_id: q.categoryId,
          name: q.name,
          character_xp: q.characterXp,
          weekly_credits: q.weeklyCredits,
          difficulty: q.difficulty,
        }))
      );
    }
  };

  const completeQuest = async (questId: string): Promise<QuestCompletion | null> => {
    const userId = getUserId();
    const questTemplate = QUEST_TEMPLATES.find((q) => q.id === questId);
    if (!questTemplate) return null;

    const today = getTodayString();
    const todayCompletions = state.weeklyCompletions.filter(
      (c) => c.questId === questId && c.completedAt.startsWith(today)
    );
    const giveCredit = todayCompletions.length < questTemplate.dailyLimit;

    const completion: QuestCompletion = {
      questId,
      categoryId: questTemplate.categoryId,
      characterXp: questTemplate.characterXp,
      weeklyCredits: giveCredit ? questTemplate.weeklyCredits : 0,
      completedAt: new Date().toISOString(),
    };

    // Persist to DB
    if (userId) {
      await supabase.from('quest_completions').insert({
        user_id: userId,
        quest_id: completion.questId,
        category_id: completion.categoryId,
        character_xp: completion.characterXp,
        weekly_credits: completion.weeklyCredits,
        completed_at: completion.completedAt,
      });
    }

    setState((prev) => {
      const newCompletions = [...prev.weeklyCompletions, completion];
      const { scores, fairnessScore } = computeCategoryScores(prev.activeCategories, newCompletions);

      // Update streak
      const streak = { ...prev.streak };
      const lastDate = streak.lastCompletedDate;

      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastDate === yesterdayStr) {
          streak.dailyStreak += 1;
        } else {
          streak.dailyStreak = 1;
        }
        streak.categoriesCompletedToday = [questTemplate.categoryId];
        streak.lastCompletedDate = today;
      } else {
        if (!streak.categoriesCompletedToday.includes(questTemplate.categoryId)) {
          streak.categoriesCompletedToday = [...streak.categoriesCompletedToday, questTemplate.categoryId];
        }
      }

      if (streak.categoriesCompletedToday.length >= 2 && streak.strongStreak < streak.dailyStreak) {
        streak.strongStreak = streak.dailyStreak;
      }

      const newXp = prev.totalCharacterXp + completion.characterXp;
      const badges = [...prev.badges];
      const newBadges: string[] = [];
      if (newXp >= 100 && !badges.includes('first_100xp')) { badges.push('first_100xp'); newBadges.push('first_100xp'); }
      if (streak.dailyStreak >= 7 && !badges.includes('streak_7')) { badges.push('streak_7'); newBadges.push('streak_7'); }
      if (prev.allTimeCompletions + 1 >= 30 && !badges.includes('no_zero_days')) { badges.push('no_zero_days'); newBadges.push('no_zero_days'); }

      // Persist streak + meta to DB (fire and forget)
      if (userId) {
        supabase.from('user_streaks').upsert({
          user_id: userId,
          daily_streak: streak.dailyStreak,
          strong_streak: streak.strongStreak,
          last_completed_date: streak.lastCompletedDate,
          categories_completed_today: streak.categoriesCompletedToday,
          streak_savers_available: streak.streakSaversAvailable,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        supabase.from('user_game_meta').upsert({
          user_id: userId,
          total_character_xp: newXp,
          all_time_completions: prev.allTimeCompletions + 1,
          is_premium: prev.isPremium,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        newBadges.forEach((bid) => {
          supabase.from('user_badges').upsert(
            { user_id: userId, badge_id: bid },
            { onConflict: 'user_id,badge_id' }
          );
        });
      }

      return {
        ...prev,
        totalCharacterXp: newXp,
        weeklyCompletions: newCompletions,
        allTimeCompletions: prev.allTimeCompletions + 1,
        weeklyCategoryScores: scores,
        weeklyFairnessScore: fairnessScore,
        streak,
        badges,
      };
    });

    return completion;
  };

  const useStreakSaver = async (): Promise<boolean> => {
    const userId = getUserId();
    if (state.streak.streakSaversAvailable <= 0) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    setState((prev) => {
      const newStreak = {
        ...prev.streak,
        streakSaversAvailable: prev.streak.streakSaversAvailable - 1,
        dailyStreak: prev.streak.dailyStreak + 1,
        lastCompletedDate: yesterdayStr,
      };
      if (userId) {
        supabase.from('user_streaks').upsert({
          user_id: userId,
          daily_streak: newStreak.dailyStreak,
          strong_streak: newStreak.strongStreak,
          last_completed_date: newStreak.lastCompletedDate,
          categories_completed_today: newStreak.categoriesCompletedToday,
          streak_savers_available: newStreak.streakSaversAvailable,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
      return { ...prev, streak: newStreak };
    });
    return true;
  };

  const upgradeToPremium = () => {
    setState((prev) => ({ ...prev, isPremium: true }));
  };

  const resetWeek = () => {
    const currentWeekStart = getWeekStart();
    setState((prev) => {
      const { scores, fairnessScore } = computeCategoryScores(prev.activeCategories, []);
      return { ...prev, weeklyCompletions: [], weeklyCategoryScores: scores, weeklyFairnessScore: fairnessScore, weekStartDate: currentWeekStart };
    });
  };

  const getXpInfo = () => getXpProgress(state.totalCharacterXp);

  const getTodayCompletions = (): QuestCompletion[] => {
    const today = getTodayString();
    return state.weeklyCompletions.filter((c) => c.completedAt.startsWith(today));
  };

  const getCategoryScore = (categoryId: string): WeeklyCategoryScore => {
    const ac = state.activeCategories.find((c) => c.categoryId === categoryId);
    const score = state.weeklyCategoryScores.find((s) => s.categoryId === categoryId);
    return score || { categoryId, earnedCredits: 0, targetCredits: ac?.weeklyTarget || 8, completionPct: 0 };
  };

  return (
    <GameContext.Provider value={{
      state, isLoading, setAvatar, setActiveCategories, setActiveQuests,
      completeQuest, useStreakSaver, upgradeToPremium, resetWeek,
      getXpInfo, getTodayCompletions, getCategoryScore,
    }}>
      {children}
    </GameContext.Provider>
  );
}
