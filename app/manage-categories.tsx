/**
 * Manage Categories Screen — MVP
 *
 * Two sections:
 *   1. Active Categories  — user's current focus areas, each removable
 *   2. Available          — all other categories, addable up to the 3-category cap
 *
 * Rules:
 *   - Max 3 active categories (consistent with onboarding)
 *   - Minimum 1 active category (can't remove the last one)
 *   - Removing a category also removes active quests that belong to it
 *   - Adding a category assigns standard intensity + standard weeklyTarget
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
import { ActiveCategory } from '@/contexts/GameContext';
import { CATEGORIES, getCategoryById } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, CategoryColors, Shadows } from '@/constants/theme';

const MAX_CATEGORIES = 3;
const MIN_CATEGORIES = 1;

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ManageCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setActiveCategories, setActiveQuests } = useGame();

  const [busy, setBusy] = useState(false);

  const { activeCategories, activeQuests } = state;
  const activeCatIds = useMemo(
    () => new Set(activeCategories.map((c) => c.categoryId)),
    [activeCategories]
  );

  // Available = all categories not currently active
  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => !activeCatIds.has(c.id)),
    [activeCatIds]
  );

  const atCap = activeCategories.length >= MAX_CATEGORIES;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRemove = useCallback((categoryId: string) => {
    if (activeCategories.length <= MIN_CATEGORIES) {
      Alert.alert(
        'One category required',
        'Your plan needs at least one active area. Add a replacement before removing this one.',
        [{ text: 'OK' }]
      );
      return;
    }

    const cat = getCategoryById(categoryId);
    const questsToRemove = activeQuests.filter((q) => q.categoryId === categoryId);
    const questNote =
      questsToRemove.length > 0
        ? `\n\nThis will also remove ${questsToRemove.length} active quest${questsToRemove.length > 1 ? 's' : ''} in this area.`
        : '';

    Alert.alert(
      'Remove category?',
      `"${cat?.name}" will be removed from your plan.${questNote}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            // Remove category
            const updatedCategories = activeCategories.filter(
              (c) => c.categoryId !== categoryId
            );
            // Remove quests belonging to that category
            const updatedQuests = activeQuests.filter(
              (q) => q.categoryId !== categoryId
            );
            await setActiveCategories(updatedCategories);
            await setActiveQuests(updatedQuests);
            setBusy(false);
          },
        },
      ]
    );
  }, [activeCategories, activeQuests, setActiveCategories, setActiveQuests]);

  const handleAdd = useCallback(async (categoryId: string) => {
    if (atCap) return;
    if (activeCatIds.has(categoryId)) return;

    const cat = getCategoryById(categoryId);
    if (!cat) return;

    setBusy(true);
    const newCategory: ActiveCategory = {
      categoryId: cat.id,
      intensity: 'standard',
      weeklyTarget: cat.weeklyTargetCredits.standard,
    };
    await setActiveCategories([...activeCategories, newCategory]);
    setBusy(false);
  }, [activeCategories, activeCatIds, atCap, setActiveCategories]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxl }]}
      >
        {/* Intro */}
        <Text style={styles.intro}>Adjust your focus areas anytime.</Text>

        {/* ── Section 1: Active Categories ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Categories</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {activeCategories.length} / {MAX_CATEGORIES}
              </Text>
            </View>
          </View>

          {activeCategories.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="apps" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No active categories</Text>
              <Text style={styles.emptyBody}>Add a focus area below to build your plan.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {activeCategories.map((ac, index) => {
                const cat = getCategoryById(ac.categoryId);
                if (!cat) return null;
                const color = CategoryColors[cat.name] || Colors.gold;
                const isLast = index === activeCategories.length - 1;
                const questCount = activeQuests.filter((q) => q.categoryId === ac.categoryId).length;

                return (
                  <View key={ac.categoryId}>
                    <View style={styles.catRow}>
                      {/* Color accent bar */}
                      <View style={[styles.catAccent, { backgroundColor: color }]} />

                      {/* Icon */}
                      <View style={[styles.catIconWrap, { backgroundColor: color + '18' }]}>
                        <MaterialIcons name={cat.icon as any} size={20} color={color} />
                      </View>

                      {/* Content */}
                      <View style={styles.catContent}>
                        <View style={styles.catTitleRow}>
                          <Text style={styles.catName}>{cat.name}</Text>
                          <Pressable
                            onPress={() => handleRemove(ac.categoryId)}
                            disabled={busy}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.removeBtn,
                              pressed && styles.removeBtnPressed,
                            ]}
                          >
                            <Text style={styles.removeBtnText}>Remove</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.catDesc} numberOfLines={2}>
                          {cat.description}
                        </Text>
                        {/* Meta */}
                        <View style={styles.metaRow}>
                          <View style={[styles.metaChip, { backgroundColor: color + '18' }]}>
                            <MaterialIcons name="target" size={10} color={color} />
                            <Text style={[styles.metaChipText, { color }]}>
                              {ac.weeklyTarget} cr / week
                            </Text>
                          </View>
                          {questCount > 0 && (
                            <View style={styles.metaChip}>
                              <MaterialIcons name="assignment" size={10} color={Colors.gold} />
                              <Text style={styles.metaChipText}>
                                {questCount} quest{questCount > 1 ? 's' : ''}
                              </Text>
                            </View>
                          )}
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

        {/* Cap info */}
        <View style={styles.ruleNote}>
          <MaterialIcons name="info-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.ruleNoteText}>
            Up to {MAX_CATEGORIES} active categories. Add quests for new areas via Manage Quests.
          </Text>
        </View>

        {/* ── Section 2: Available Categories ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Categories</Text>
            {atCap && (
              <View style={styles.capBadge}>
                <Text style={styles.capBadgeText}>Limit reached</Text>
              </View>
            )}
          </View>

          {availableCategories.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="check-circle" size={28} color={Colors.success} />
              <Text style={styles.emptyTitle}>All categories active</Text>
              <Text style={styles.emptyBody}>
                You're already focused on all available growth areas.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {availableCategories.map((cat, index) => {
                const color = CategoryColors[cat.name] || Colors.gold;
                const isLast = index === availableCategories.length - 1;

                return (
                  <View key={cat.id}>
                    <View style={[styles.catRow, atCap && styles.rowDimmed]}>
                      <View style={[styles.catAccent, { backgroundColor: color }]} />

                      <View style={[styles.catIconWrap, { backgroundColor: color + '18' }]}>
                        <MaterialIcons name={cat.icon as any} size={20} color={color} />
                      </View>

                      <View style={styles.catContent}>
                        <View style={styles.catTitleRow}>
                          <Text style={styles.catName}>{cat.name}</Text>
                          <Pressable
                            onPress={() => void handleAdd(cat.id)}
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
                            <Text
                              style={[
                                styles.addBtnText,
                                atCap && styles.addBtnTextDisabled,
                              ]}
                            >
                              {atCap ? 'Full' : 'Add'}
                            </Text>
                          </Pressable>
                        </View>
                        <Text style={styles.catDesc} numberOfLines={2}>
                          {cat.description}
                        </Text>
                        <View style={styles.metaRow}>
                          <View style={[styles.metaChip, { backgroundColor: color + '18' }]}>
                            <MaterialIcons name="target" size={10} color={color} />
                            <Text style={[styles.metaChipText, { color }]}>
                              {cat.weeklyTargetCredits.standard} cr / week
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
  countBadge: {
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  countBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },
  capBadge: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.round,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  capBadgeText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden',
    ...Shadows.sm,
  },

  // Category row
  catRow: { flexDirection: 'row', alignItems: 'stretch' },
  rowDimmed: { opacity: 0.42 },
  catAccent: { width: 3, borderRadius: 2 },
  catIconWrap: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    margin: Spacing.md, marginRight: 0, alignSelf: 'flex-start', marginTop: Spacing.md,
  },
  catContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  catTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: Spacing.sm,
  },
  catName: {
    flex: 1, fontSize: FontSize.md,
    fontWeight: FontWeight.semibold, color: Colors.textPrimary,
  },
  catDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

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
    flexDirection: 'row', alignItems: 'flex-start', gap: 5,
    paddingHorizontal: Spacing.xs, marginTop: -Spacing.sm,
  },
  ruleNoteText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1, lineHeight: 16 },

  // Empty states
  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  emptyBody: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
