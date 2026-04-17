/**
 * Manage Quests Screen — MVP
 *
 * Two sections:
 *   1. Active Quests  — user's current quest plan, each removable
 *   2. Add More       — available quests from active categories not yet active
 *
 * Rules:
 *   - Max 2 quests per category (consistent with onboarding)
 *   - No duplicate active quests
 *   - Changes update GameContext immediately and persist via Supabase
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { ActiveQuest } from '@/contexts/GameContext';
import { QUEST_TEMPLATES, getCategoryById } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors, Shadows } from '@/constants/theme';

const MAX_QUESTS_PER_CAT = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

function difficultyColor(d: string): string {
  switch (d) {
    case 'easy': return Colors.success;
    case 'standard': return Colors.gold;
    case 'challenging': return Colors.amber;
    case 'stretch': return Colors.error;
    default: return Colors.textMuted;
  }
}

function difficultyLabel(d: string): string {
  switch (d) {
    case 'easy': return 'Easy';
    case 'standard': return 'Standard';
    case 'challenging': return 'Challenging';
    case 'stretch': return 'Stretch';
    default: return d;
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ManageQuestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setActiveQuests } = useGame();

  const [busy, setBusy] = useState(false);

  const { activeQuests, activeCategories } = state;

  // Derive available replacement quests:
  //   - only from active categories
  //   - not already in activeQuests
  //   - sorted by XP ascending
  const availableQuests = useMemo(() => {
    const activeCatIds = new Set(activeCategories.map((c) => c.categoryId));
    const activeQuestIds = new Set(activeQuests.map((q) => q.questId));
    return QUEST_TEMPLATES.filter(
      (t) => activeCatIds.has(t.categoryId) && !activeQuestIds.has(t.id)
    ).sort((a, b) => a.characterXp - b.characterXp);
  }, [activeCategories, activeQuests]);

  // Count active quests per category (for the per-cat cap)
  const countPerCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of activeQuests) {
      map[q.categoryId] = (map[q.categoryId] || 0) + 1;
    }
    return map;
  }, [activeQuests]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRemove = useCallback((questId: string) => {
    const quest = activeQuests.find((q) => q.questId === questId);
    if (!quest) return;

    Alert.alert(
      'Remove quest?',
      `"${quest.name}" will be removed from your active plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const updated = activeQuests.filter((q) => q.questId !== questId);
            await setActiveQuests(updated);
            setBusy(false);
          },
        },
      ]
    );
  }, [activeQuests, setActiveQuests]);

  const handleAdd = useCallback(async (templateId: string) => {
    const template = QUEST_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    // Double-check cap
    if ((countPerCat[template.categoryId] || 0) >= MAX_QUESTS_PER_CAT) return;

    // Double-check no duplicate
    if (activeQuests.some((q) => q.questId === templateId)) return;

    setBusy(true);
    const newQuest: ActiveQuest = {
      questId: template.id,
      categoryId: template.categoryId,
      name: template.name,
      characterXp: template.characterXp,
      weeklyCredits: template.weeklyCredits,
      difficulty: template.difficulty,
    };
    await setActiveQuests([...activeQuests, newQuest]);
    setBusy(false);
  }, [activeQuests, setActiveQuests, countPerCat]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Quests</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxl }]}
      >
        {/* Intro */}
        <Text style={styles.intro}>Adjust your active plan anytime.</Text>

        {/* ── Section 1: Active Quests ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Quests</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeQuests.length}</Text>
            </View>
          </View>

          {activeQuests.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="assignment" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No active quests</Text>
              <Text style={styles.emptyBody}>Add quests below to build your plan.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {activeQuests.map((quest, index) => {
                const cat = getCategoryById(quest.categoryId);
                const catColor = CategoryColors[cat?.name || ''] || Colors.gold;
                const isLast = index === activeQuests.length - 1;
                const template = QUEST_TEMPLATES.find((t) => t.id === quest.questId);

                return (
                  <View key={quest.questId}>
                    <View style={styles.questRow}>
                      {/* Category color accent */}
                      <View style={[styles.catAccent, { backgroundColor: catColor }]} />

                      <View style={styles.questContent}>
                        <View style={styles.questTitleRow}>
                          <Text style={styles.questName} numberOfLines={1}>
                            {quest.name}
                          </Text>
                          <Pressable
                            onPress={() => handleRemove(quest.questId)}
                            disabled={busy}
                            hitSlop={8}
                            style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
                          >
                            <Text style={styles.removeBtnText}>Remove</Text>
                          </Pressable>
                        </View>

                        {template?.description ? (
                          <Text style={styles.questDesc} numberOfLines={2}>
                            {template.description}
                          </Text>
                        ) : null}

                        {/* Meta chips */}
                        <View style={styles.metaRow}>
                          {cat ? (
                            <View style={[styles.metaChip, { backgroundColor: catColor + '18' }]}>
                              <MaterialIcons name={cat.icon as any} size={10} color={catColor} />
                              <Text style={[styles.metaChipText, { color: catColor }]}>{cat.name}</Text>
                            </View>
                          ) : null}
                          <View style={styles.metaChip}>
                            <MaterialIcons name="bolt" size={10} color={Colors.gold} />
                            <Text style={styles.metaChipText}>{quest.characterXp} XP</Text>
                          </View>
                          <View style={[styles.metaChip, { backgroundColor: Colors.infoSoft }]}>
                            <MaterialIcons name="toll" size={10} color={Colors.info} />
                            <Text style={[styles.metaChipText, { color: Colors.info }]}>
                              {quest.weeklyCredits} cr
                            </Text>
                          </View>
                          {template?.durationMinutes ? (
                            <View style={[styles.metaChip, { backgroundColor: Colors.surfaceElevated }]}>
                              <MaterialIcons name="schedule" size={10} color={Colors.textMuted} />
                              <Text style={[styles.metaChipText, { color: Colors.textMuted }]}>
                                {template.durationMinutes}min
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    {!isLast && <View style={styles.rowDivider} />}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Per-category cap info */}
        <View style={styles.ruleNote}>
          <MaterialIcons name="info-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.ruleNoteText}>
            Up to {MAX_QUESTS_PER_CAT} quests per category.
          </Text>
        </View>

        {/* ── Section 2: Available quests ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add More</Text>
            <Text style={styles.sectionSubtitle}>From your active categories</Text>
          </View>

          {availableQuests.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="check-circle" size={28} color={Colors.success} />
              <Text style={styles.emptyTitle}>All set</Text>
              <Text style={styles.emptyBody}>
                {activeCategories.length === 0
                  ? 'Set up your categories first to see available quests.'
                  : 'No more quests to add in your current categories.'}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {availableQuests.map((template, index) => {
                const cat = getCategoryById(template.categoryId);
                const catColor = CategoryColors[cat?.name || ''] || Colors.gold;
                const catCount = countPerCat[template.categoryId] || 0;
                const atCap = catCount >= MAX_QUESTS_PER_CAT;
                const isLast = index === availableQuests.length - 1;

                return (
                  <View key={template.id}>
                    <View style={[styles.questRow, atCap && styles.rowDimmed]}>
                      <View style={[styles.catAccent, { backgroundColor: catColor }]} />

                      <View style={styles.questContent}>
                        <View style={styles.questTitleRow}>
                          <Text style={styles.questName} numberOfLines={1}>
                            {template.name}
                          </Text>
                          <Pressable
                            onPress={() => void handleAdd(template.id)}
                            disabled={busy || atCap}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.addBtn,
                              atCap && styles.addBtnDisabled,
                              pressed && !atCap && styles.addBtnPressed,
                            ]}
                          >
                            <MaterialIcons
                              name="add"
                              size={14}
                              color={atCap ? Colors.textMuted : Colors.textInverse}
                            />
                            <Text style={[styles.addBtnText, atCap && styles.addBtnTextDisabled]}>
                              {atCap ? 'Full' : 'Add'}
                            </Text>
                          </Pressable>
                        </View>

                        <Text style={styles.questDesc} numberOfLines={2}>
                          {template.description}
                        </Text>

                        {/* Meta chips */}
                        <View style={styles.metaRow}>
                          {cat ? (
                            <View style={[styles.metaChip, { backgroundColor: catColor + '18' }]}>
                              <MaterialIcons name={cat.icon as any} size={10} color={catColor} />
                              <Text style={[styles.metaChipText, { color: catColor }]}>{cat.name}</Text>
                            </View>
                          ) : null}
                          <View style={styles.metaChip}>
                            <MaterialIcons name="bolt" size={10} color={Colors.gold} />
                            <Text style={styles.metaChipText}>{template.characterXp} XP</Text>
                          </View>
                          <View style={[styles.metaChip, { backgroundColor: Colors.infoSoft }]}>
                            <MaterialIcons name="toll" size={10} color={Colors.info} />
                            <Text style={[styles.metaChipText, { color: Colors.info }]}>
                              {template.weeklyCredits} cr
                            </Text>
                          </View>
                          {template.durationMinutes ? (
                            <View style={[styles.metaChip, { backgroundColor: Colors.surfaceElevated }]}>
                              <MaterialIcons name="schedule" size={10} color={Colors.textMuted} />
                              <Text style={[styles.metaChipText, { color: Colors.textMuted }]}>
                                {template.durationMinutes}min
                              </Text>
                            </View>
                          ) : null}
                          <View style={[styles.metaChip, { backgroundColor: Colors.surfaceElevated }]}>
                            <View
                              style={[
                                styles.difficultyDot,
                                { backgroundColor: difficultyColor(template.difficulty) },
                              ]}
                            />
                            <Text style={[styles.metaChipText, { color: difficultyColor(template.difficulty) }]}>
                              {difficultyLabel(template.difficulty)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    {!isLast && <View style={styles.rowDivider} />}
                  </View>
                );
              })}
            </View>
          )}
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

  scroll: { padding: Spacing.xl, gap: Spacing.lg },

  intro: {
    fontSize: FontSize.md, color: Colors.textSecondary,
    lineHeight: 22, marginTop: -Spacing.sm,
  },

  // Sections
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted },
  countBadge: {
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  countBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },

  // Card container
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden',
    ...Shadows.sm,
  },

  // Quest rows
  questRow: { flexDirection: 'row', alignItems: 'stretch' },
  rowDimmed: { opacity: 0.45 },
  catAccent: { width: 3, borderRadius: 2 },
  questContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  questTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  questName: {
    flex: 1, fontSize: FontSize.md,
    fontWeight: FontWeight.semibold, color: Colors.textPrimary,
  },
  questDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  rowDivider: { height: 1, backgroundColor: Colors.surfaceBorder },

  // Meta chips
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  metaChipText: {
    fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gold,
  },
  difficultyDot: { width: 6, height: 6, borderRadius: 3 },

  // Remove button
  removeBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.round,
    backgroundColor: Colors.errorSoft,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  removeBtnPressed: { opacity: 0.7 },
  removeBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.error },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.round,
    backgroundColor: Colors.gold,
  },
  addBtnPressed: { opacity: 0.8 },
  addBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  addBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textInverse },
  addBtnTextDisabled: { color: Colors.textMuted },

  // Rule note
  ruleNote: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.xs, marginTop: -Spacing.sm,
  },
  ruleNoteText: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Empty states
  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  emptyBody: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
