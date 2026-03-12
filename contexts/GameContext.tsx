import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, QUEST_TEMPLATES, getXpProgress } from '@/constants/gameData';

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
  setAvatar: (avatar: AvatarConfig) => void;
  setActiveCategories: (categories: ActiveCategory[]) => void;
  setActiveQuests: (quests: ActiveQuest[]) => void;
  completeQuest: (questId: string) => QuestCompletion | null;
  useStreakSaver: () => boolean;
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
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function computeCategoryScores(
  activeCategories: ActiveCategory[],
  weeklyCompletions: QuestCompletion[]
): { scores: WeeklyCategoryScore[]; fairnessScore: number } {
  const scores: WeeklyCategoryScore[] = activeCategories.map((ac) => {
    const cat = CATEGORIES.find((c) => c.id === ac.categoryId);
    if (!cat) return { categoryId: ac.categoryId, earnedCredits: 0, targetCredits: ac.weeklyTarget, completionPct: 0 };

    const earned = weeklyCompletions
      .filter((c) => c.categoryId === ac.categoryId)
      .reduce((sum, c) => sum + c.weeklyCredits, 0);

    const capped = Math.min(earned, ac.weeklyTarget);
    const completionPct = ac.weeklyTarget > 0 ? Math.min((earned / ac.weeklyTarget) * 100, 100) : 0;

    return { categoryId: ac.categoryId, earnedCredits: earned, targetCredits: ac.weeklyTarget, completionPct };
  });

  const fairnessScore =
    scores.length > 0 ? scores.reduce((sum, s) => sum + s.completionPct, 0) / scores.length : 0;

  return { scores, fairnessScore };
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const saved = await AsyncStorage.getItem('levelup_game');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if we need to reset the week
        const savedWeekStart = parsed.weekStartDate;
        const currentWeekStart = getWeekStart();
        if (savedWeekStart !== currentWeekStart) {
          parsed.weeklyCompletions = [];
          parsed.weekStartDate = currentWeekStart;
          const { scores, fairnessScore } = computeCategoryScores(parsed.activeCategories || [], []);
          parsed.weeklyCategoryScores = scores;
          parsed.weeklyFairnessScore = fairnessScore;
        }
        setState(parsed);
      }
    } catch (e) {
      console.log('Game load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = async (newState: GameState) => {
    try {
      await AsyncStorage.setItem('levelup_game', JSON.stringify(newState));
    } catch (e) {
      console.log('Game save error:', e);
    }
  };

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const setAvatar = (avatar: AvatarConfig) => {
    updateState((prev) => ({ ...prev, avatar }));
  };

  const setActiveCategories = (categories: ActiveCategory[]) => {
    updateState((prev) => {
      const { scores, fairnessScore } = computeCategoryScores(categories, prev.weeklyCompletions);
      return { ...prev, activeCategories: categories, weeklyCategoryScores: scores, weeklyFairnessScore: fairnessScore };
    });
  };

  const setActiveQuests = (quests: ActiveQuest[]) => {
    updateState((prev) => ({ ...prev, activeQuests: quests }));
  };

  const completeQuest = (questId: string): QuestCompletion | null => {
    const quest = QUEST_TEMPLATES.find((q) => q.id === questId) ||
      state.activeQuests.find((q) => q.questId === questId);

    if (!quest) return null;

    const today = getTodayString();
    const questTemplate = QUEST_TEMPLATES.find((q) => q.id === questId);
    if (!questTemplate) return null;

    // Check daily limit
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

    updateState((prev) => {
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

      if (streak.categoriesCompletedToday.length >= 2) {
        if (streak.strongStreak < streak.dailyStreak) {
          streak.strongStreak = streak.dailyStreak;
        }
      }

      // Check badges
      const badges = [...prev.badges];
      const newXp = prev.totalCharacterXp + completion.characterXp;
      if (newXp >= 100 && !badges.includes('first_100xp')) badges.push('first_100xp');
      if (streak.dailyStreak >= 7 && !badges.includes('streak_7')) badges.push('streak_7');

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

  const useStreakSaver = (): boolean => {
    if (state.streak.streakSaversAvailable <= 0) return false;
    updateState((prev) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return {
        ...prev,
        streak: {
          ...prev.streak,
          streakSaversAvailable: prev.streak.streakSaversAvailable - 1,
          dailyStreak: prev.streak.dailyStreak + 1,
          lastCompletedDate: yesterdayStr,
        },
      };
    });
    return true;
  };

  const upgradeToPremium = () => {
    updateState((prev) => ({ ...prev, isPremium: true }));
  };

  const resetWeek = () => {
    updateState((prev) => {
      const { scores, fairnessScore } = computeCategoryScores(prev.activeCategories, []);
      return {
        ...prev,
        weeklyCompletions: [],
        weeklyCategoryScores: scores,
        weeklyFairnessScore: fairnessScore,
        weekStartDate: getWeekStart(),
      };
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
