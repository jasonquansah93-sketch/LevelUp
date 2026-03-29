import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, Animated, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { AvatarConfig } from '@/contexts/GameContext';
import { AvatarBuilder } from '@/components/feature/AvatarBuilder';
import { SKIN_TONES, SKIN_TONE_ORDER, CLOTHING_ACCENTS, CLOTHING_LABELS } from '@/constants/avatarAssets';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

// Only 2 base characters — Neutral removed.
const GENDER_OPTIONS = [
  { id: 'masculine', label: 'Masculine', icon: 'male' as const },
  { id: 'feminine', label: 'Feminine', icon: 'female' as const },
];

const HAIRSTYLE_OPTIONS = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
  { id: 'buzz', label: 'Buzz Cut' },
  { id: 'bald', label: 'Bald' },
];

const CLOTHING_OPTIONS = [
  { id: 'casual', label: 'Casual' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'business', label: 'Business' },
  { id: 'streetwear', label: 'Street' },
];

const BODY_OPTIONS = [
  { id: 'lean', label: 'Lean' },
  { id: 'average', label: 'Average' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'broad', label: 'Broad' },
];

const SKIN_ORDER = SKIN_TONE_ORDER;

// ─── In-screen toast ─────────────────────────────────────────────────────────

function useToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const [message, setMessage] = useState('');

  const show = useCallback((msg: string) => {
    setMessage(msg);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 260, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const ToastView = (
    <Animated.View
      pointerEvents="none"
      style={[
        toastStyles.toast,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <MaterialIcons name="check-circle" size={17} color="#fff" />
      <Text style={toastStyles.text}>{message}</Text>
    </Animated.View>
  );

  return { show, ToastView };
}

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.round,
    zIndex: 999,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function EditAvatarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, setAvatar } = useGame();
  const { show: showToast, ToastView } = useToast();

  const [config, setConfig] = useState<AvatarConfig>({ ...state.avatar });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const update = useCallback((key: keyof AvatarConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await setAvatar(config);
      setIsDirty(false);
      showToast('Character saved!');
    } catch {
      showToast('Save failed — try again');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Toast overlay */}
      {ToastView}

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.topTitle}>Edit Character</Text>
        <Pressable
          onPress={() => void handleSave()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.saveBtn,
            isDirty && styles.saveBtnActive,
            pressed && styles.pressed,
          ]}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={isDirty ? Colors.textInverse : Colors.textMuted} />
          ) : (
            <Text style={[styles.saveBtnText, isDirty && styles.saveBtnTextActive]}>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* ── Live preview card ─────────────────────────────── */}
        <View style={styles.previewCard}>
          {/* Character name */}
          <View style={styles.nameRow}>
            <MaterialIcons name="edit" size={15} color={Colors.textMuted} />
            <TextInput
              style={styles.nameInput}
              value={config.name}
              onChangeText={(v) => update('name', v)}
              placeholder="Character name"
              placeholderTextColor={Colors.textMuted}
              maxLength={24}
            />
          </View>

          {/* Avatar stage — transparent container, avatar PNG floats freely */}
          <View style={styles.previewStage}>
            <AvatarBuilder config={config} size={272} animate />
          </View>

          <Text style={styles.previewHint}>
            Your character updates live as you choose options below
          </Text>
        </View>

        {/* ── Presentation ─────────────────────────────────── */}
        <Section title="Presentation">
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((g) => {
              const isActive = config.genderPresentation === g.id;
              return (
                <Pressable
                  key={g.id}
                  style={({ pressed }) => [
                    styles.genderChip,
                    isActive && styles.genderChipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => update('genderPresentation', g.id)}
                >
                  <MaterialIcons
                    name={g.icon}
                    size={15}
                    color={isActive ? Colors.textInverse : Colors.textSecondary}
                  />
                  <Text style={[styles.genderLabel, isActive && styles.genderLabelActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Skin Tone ─────────────────────────────────────── */}
        <Section title="Skin Tone">
          <View style={styles.skinRow}>
            {SKIN_ORDER.map((toneId) => {
              const tone = SKIN_TONES[toneId];
              const isActive = config.skinTone === toneId;
              return (
                <Pressable
                  key={toneId}
                  style={[
                    styles.skinBtn,
                    { backgroundColor: tone.color },
                    isActive && styles.skinActive,
                  ]}
                  onPress={() => update('skinTone', toneId)}
                >
                  {isActive && (
                    <MaterialIcons
                      name="check"
                      size={13}
                      color={toneId === 'tone1' ? '#888' : '#fff'}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.skinLabel}>{SKIN_TONES[config.skinTone]?.label ?? ''}</Text>
        </Section>

        {/* ── Hairstyle ─────────────────────────────────────── */}
        <Section title="Hairstyle">
          <ChipRow
            options={HAIRSTYLE_OPTIONS}
            selected={config.hairstyle}
            onSelect={(v) => update('hairstyle', v)}
          />
        </Section>

        {/* ── Clothing ─────────────────────────────────────── */}
        <Section title="Clothing Style">
          <ChipRow
            options={CLOTHING_OPTIONS}
            selected={config.clothingStyle}
            onSelect={(v) => update('clothingStyle', v)}
            accentColor={CLOTHING_ACCENTS[config.clothingStyle]}
          />
        </Section>

        {/* ── Body Type ────────────────────────────────────── */}
        <Section title="Body Type">
          <ChipRow
            options={BODY_OPTIONS}
            selected={config.bodyType}
            onSelect={(v) => update('bodyType', v)}
          />
        </Section>
      </ScrollView>

      {/* ── Sticky save footer ───────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Pressable
          style={({ pressed }) => [
            styles.footerSaveBtn,
            !isDirty && styles.footerSaveBtnDisabled,
            pressed && isDirty && styles.pressed,
          ]}
          onPress={() => void handleSave()}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <MaterialIcons name="check" size={20} color={Colors.textInverse} />
          )}
          <Text style={styles.footerSaveBtnText}>
            {isSaving ? 'Saving…' : isDirty ? 'Save Character' : 'No Changes'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
  accentColor,
}: {
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
  accentColor?: string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const isActive = selected === o.id;
        const activeBg = accentColor ?? Colors.gold;
        return (
          <Pressable
            key={o.id}
            style={({ pressed }) => [
              styles.chip,
              isActive && { backgroundColor: activeBg, borderColor: activeBg },
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(o.id)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.round,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  saveBtnTextActive: {
    color: Colors.textInverse,
  },

  scroll: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },

  // ─ Preview card ───────────────────────────────────────────────────
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    justifyContent: 'center',
  },
  nameInput: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 160,
    paddingVertical: 2,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.gold + '55',
  },
  previewStage: {
    backgroundColor: Colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    minHeight: 318,
    overflow: 'hidden',
  },
  previewHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    lineHeight: 18,
  },

  // ─ Sections ───────────────────────────────────────────────────────
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ─ Gender ────────────────────────────────────────────────────────
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderChip: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  genderChipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  genderLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  genderLabelActive: { color: Colors.textInverse },

  // ─ Skin tone ─────────────────────────────────────────────────────
  skinRow: { flexDirection: 'row', gap: 10 },
  skinBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinActive: { borderColor: Colors.gold, transform: [{ scale: 1.18 }] },
  skinLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // ─ Chip row ──────────────────────────────────────────────────────
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  chipTextActive: { color: Colors.textInverse },

  // ─ Footer ─────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  footerSaveBtn: {
    backgroundColor: Colors.gold,
    height: 54,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  footerSaveBtnDisabled: {
    backgroundColor: Colors.surfaceElevated,
  },
  footerSaveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  pressed: { opacity: 0.82, transform: [{ scale: 0.982 }] },
});
