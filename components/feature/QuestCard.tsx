import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { QuestTemplate } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows, CategoryColors } from '@/constants/theme';

interface QuestCardProps {
  quest: QuestTemplate;
  completed?: boolean;
  completionCount?: number;
  onPress: () => void;
  categoryName?: string;
}

const DIFF_LABELS: Record<string, string> = {
  easy: 'Easy',
  standard: 'Standard',
  challenging: 'Hard',
  stretch: 'Stretch',
};

export function QuestCard({ quest, completed = false, completionCount = 0, onPress, categoryName }: QuestCardProps) {
  const categoryColor = CategoryColors[categoryName || ''] || Colors.gold;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, completed && styles.cardCompleted, pressed && styles.pressed]}
    >
      <View style={[styles.accent, { backgroundColor: categoryColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, completed && styles.nameCompleted]} numberOfLines={1}>
              {quest.name}
            </Text>
            {completed && completionCount > 0 && (
              <View style={styles.completedBadge}>
                <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                {completionCount > 1 && <Text style={styles.countText}>×{completionCount}</Text>}
              </View>
            )}
          </View>
          <View style={styles.rewards}>
            <View style={styles.rewardChip}>
              <MaterialIcons name="bolt" size={12} color={Colors.gold} />
              <Text style={styles.rewardText}>{quest.characterXp} XP</Text>
            </View>
            <View style={[styles.rewardChip, styles.creditChip]}>
              <MaterialIcons name="toll" size={12} color={Colors.info} />
              <Text style={[styles.rewardText, { color: Colors.info }]}>{quest.weeklyCredits}cr</Text>
            </View>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {quest.description}
        </Text>
        <View style={styles.footer}>
          <View style={[styles.diffBadge, styles[quest.difficulty as keyof typeof styles] as any]}>
            <Text style={styles.diffText}>{DIFF_LABELS[quest.difficulty]}</Text>
          </View>
          {quest.durationMinutes ? (
            <View style={styles.duration}>
              <MaterialIcons name="schedule" size={11} color={Colors.textMuted} />
              <Text style={styles.durationText}>{quest.durationMinutes}min</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  cardCompleted: {
    opacity: 0.65,
    borderColor: Colors.success + '40',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  nameCompleted: {
    color: Colors.textSecondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
  rewards: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.goldSoft,
    borderRadius: Radius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  creditChip: {
    backgroundColor: Colors.infoSoft,
  },
  rewardText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  diffBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  easy: { backgroundColor: Colors.successSoft },
  standard: { backgroundColor: Colors.goldSoft },
  challenging: { backgroundColor: Colors.warningSoft },
  stretch: { backgroundColor: Colors.errorSoft },
  diffText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  durationText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
