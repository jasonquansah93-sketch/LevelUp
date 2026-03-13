import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { QuestCompletion } from '@/contexts/GameContext';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

interface QuestCompletionModalProps {
  visible: boolean;
  completion: QuestCompletion | null;
  questName: string;
  categoryName: string;
  categoryCompletionPct: number;
  streakDay: number;
  onClose: () => void;
}

export function QuestCompletionModal({
  visible,
  completion,
  questName,
  categoryName,
  categoryCompletionPct,
  streakDay,
  onClose,
}: QuestCompletionModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!completion) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <Pressable>
            <View style={styles.iconRing}>
              <MaterialIcons name="check" size={36} color={Colors.success} />
            </View>

            <Text style={styles.label}>Quest Complete</Text>
            <Text style={styles.questName}>{questName}</Text>

            <View style={styles.rewardRow}>
              <View style={styles.rewardBox}>
                <MaterialIcons name="bolt" size={22} color={Colors.gold} />
                <Text style={styles.rewardValue}>+{completion.characterXp}</Text>
                <Text style={styles.rewardUnit}>Character XP</Text>
              </View>
              {completion.weeklyCredits > 0 && (
                <View style={styles.rewardBox}>
                  <MaterialIcons name="toll" size={22} color={Colors.info} />
                  <Text style={[styles.rewardValue, { color: Colors.info }]}>+{completion.weeklyCredits}</Text>
                  <Text style={styles.rewardUnit}>Weekly Credit</Text>
                </View>
              )}
              {completion.weeklyCredits === 0 && (
                <View style={styles.rewardBox}>
                  <MaterialIcons name="lock" size={22} color={Colors.textMuted} />
                  <Text style={[styles.rewardValue, { color: Colors.textMuted }]}>Cap Reached</Text>
                  <Text style={styles.rewardUnit}>Daily Limit</Text>
                </View>
              )}
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="local-fire-department" size={16} color={Colors.amber} />
                <Text style={styles.statText}>Streak Day {streakDay}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <MaterialIcons name="insights" size={16} color={Colors.success} />
                <Text style={styles.statText}>{categoryName} {Math.round(categoryCompletionPct)}%</Text>
              </View>
            </View>

            <PrimaryButton label="Keep Going" onPress={onClose} style={{ marginTop: Spacing.md }} />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(42,26,10,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success + '50',
    ...Shadows.md,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.successSoft,
    borderWidth: 2,
    borderColor: Colors.success + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    alignSelf: 'center',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  questName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rewardBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  rewardValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
  },
  rewardUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.surfaceBorder,
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
