import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

interface PaywallModalProps {
  visible: boolean;
  trigger?: string;
  onClose: () => void;
  onUpgrade: () => void;
}

const PREMIUM_FEATURES = [
  { icon: 'apps', text: 'Up to 5 active categories' },
  { icon: 'assignment', text: 'Unlimited quests per category' },
  { icon: 'leaderboard', text: 'Leaderboard & friend comparison' },
  { icon: 'insights', text: 'Deep analytics & trends' },
  { icon: 'palette', text: 'Full avatar customization' },
  { icon: 'notifications-active', text: 'Smart reminders' },
  { icon: 'shield', text: '2 streak savers per month' },
];

export function PaywallModal({ visible, trigger, onClose, onUpgrade }: PaywallModalProps) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.crownWrap}>
              <MaterialIcons name="workspace-premium" size={28} color={Colors.gold} />
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.title}>Level Up Premium</Text>
          <Text style={styles.subtitle}>
            {trigger || 'Unlock everything and build your strongest self.'}
          </Text>

          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={f.icon as any} size={18} color={Colors.gold} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pricingRow}>
            <Pressable style={styles.priceCard} onPress={onUpgrade}>
              <Text style={styles.priceLabel}>Monthly</Text>
              <Text style={styles.priceAmount}>$4.99</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </Pressable>
            <Pressable style={[styles.priceCard, styles.priceCardHighlight]} onPress={onUpgrade}>
              <View style={styles.bestValueTag}>
                <Text style={styles.bestValueText}>Best Value</Text>
              </View>
              <Text style={[styles.priceLabel, { color: Colors.textInverse }]}>Yearly</Text>
              <Text style={[styles.priceAmount, { color: Colors.textInverse }]}>$19.99</Text>
              <Text style={[styles.pricePeriod, { color: Colors.textInverse + 'AA' }]}>/year</Text>
            </Pressable>
          </View>

          <PrimaryButton label="Start Premium" onPress={onUpgrade} />
          <Pressable onPress={onClose} style={styles.skipBtn} hitSlop={8}>
            <Text style={styles.skipText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(42,26,10,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.gold + '40',
    ...Shadows.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: Radius.round,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  crownWrap: {
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  featureList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  priceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 2,
  },
  priceCardHighlight: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  bestValueTag: {
    backgroundColor: Colors.textInverse + '20',
    borderRadius: Radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  bestValueText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  priceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  priceAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
  },
  pricePeriod: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
