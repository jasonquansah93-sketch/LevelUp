import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { AvatarConfig } from '@/contexts/GameContext';
import { AvatarDisplay } from '@/components/feature/AvatarDisplay';
import { AVATAR_OPTIONS } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

type CreationPath = 'choose' | 'photo' | 'manual';

const SKIN_COLORS: Record<string, string> = {
  tone1: '#FDDBB4', tone2: '#F0C27F', tone3: '#C68642',
  tone4: '#8D5524', tone5: '#5C3317', tone6: '#3B1F0B',
};

export default function AvatarCreation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAvatar } = useGame();
  const { user } = useAuth();

  const [path, setPath] = useState<CreationPath>('choose');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [config, setConfig] = useState<AvatarConfig>({
    genderPresentation: 'neutral',
    skinTone: 'tone2',
    hairstyle: 'short',
    clothingStyle: 'casual',
    bodyType: 'average',
    name: user?.displayName || 'My Character',
  });

  const update = (key: keyof AvatarConfig, value: string) =>
    setConfig((p) => ({ ...p, [key]: value }));

  const handleNext = () => {
    setAvatar(config);
    router.push('/onboarding/categories');
  };

  const handlePhotoGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      update('genderPresentation', 'photo');
    }, 2500);
  };

  if (path === 'choose') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StepBar step={1} onBack={() => router.back()} />

        <View style={styles.chooseContent}>
          <Text style={styles.chooseTitle}>Create your character</Text>
          <Text style={styles.chooseSubtitle}>
            Your character grows as you level up in real life.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.pathCard, styles.pathCardPrimary, pressed && styles.pressed]}
            onPress={() => setPath('photo')}
          >
            <View style={styles.pathCardIcon}>
              <MaterialIcons name="camera-alt" size={28} color={Colors.gold} />
            </View>
            <View style={styles.pathCardText}>
              <Text style={styles.pathCardTitle}>Generate from photo</Text>
              <Text style={styles.pathCardSub}>AI creates a premium stylized version of you</Text>
            </View>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.gold} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.pathCard, pressed && styles.pressed]}
            onPress={() => setPath('manual')}
          >
            <View style={[styles.pathCardIcon, { backgroundColor: Colors.surfaceBorder }]}>
              <MaterialIcons name="tune" size={28} color={Colors.textSecondary} />
            </View>
            <View style={styles.pathCardText}>
              <Text style={[styles.pathCardTitle, { color: Colors.textPrimary }]}>Build manually</Text>
              <Text style={styles.pathCardSub}>Choose style, skin tone, and clothing</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.textMuted} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (path === 'photo') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}>
        <StepBar step={1} onBack={() => setPath('choose')} />

        <View style={styles.photoContent}>
          <Text style={styles.chooseTitle}>Generate from photo</Text>
          <Text style={styles.chooseSubtitle}>
            We create a premium stylized character that looks like you.
          </Text>

          <View style={styles.photoZone}>
            {!generated ? (
              <>
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={48} color={Colors.textMuted} />
                  <Text style={styles.photoPlaceholderText}>Tap to upload photo</Text>
                  <Text style={styles.photoPlaceholderSub}>Portrait works best</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressed]}
                  onPress={handlePhotoGenerate}
                >
                  <MaterialIcons name="upload" size={18} color={Colors.textInverse} />
                  <Text style={styles.uploadBtnText}>Upload Photo</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.generatedPreview}>
                  <AvatarDisplay avatar={config} level={1} size="xl" />
                  <View style={styles.generatedBadge}>
                    <MaterialIcons name="auto-awesome" size={12} color={Colors.gold} />
                    <Text style={styles.generatedBadgeText}>AI Generated</Text>
                  </View>
                </View>

                <Pressable style={styles.regenBtn} onPress={handlePhotoGenerate}>
                  <MaterialIcons name="refresh" size={16} color={Colors.textSecondary} />
                  <Text style={styles.regenBtnText}>Regenerate</Text>
                </Pressable>
              </>
            )}
          </View>

          {!generated && (
            <Pressable style={styles.skipPhotoBtn} onPress={() => setPath('manual')}>
              <Text style={styles.skipPhotoText}>Build manually instead</Text>
            </Pressable>
          )}

          {generated && (
            <>
              <View style={styles.nameFieldWrap}>
                <Text style={styles.nameLabel}>Character Name</Text>
                <TextInput
                  style={styles.nameInput}
                  value={config.name}
                  onChangeText={(v) => update('name', v)}
                  placeholder="Your character name"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={24}
                />
              </View>
              <Pressable
                style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
                onPress={handleNext}
              >
                <Text style={styles.nextBtnText}>Choose Categories</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
              </Pressable>
            </>
          )}
        </View>

        {/* Generating modal */}
        <Modal transparent visible={generating} animationType="fade">
          <View style={styles.generatingOverlay}>
            <View style={styles.generatingCard}>
              <ActivityIndicator size="large" color={Colors.gold} />
              <Text style={styles.generatingTitle}>Creating your character</Text>
              <Text style={styles.generatingSubtitle}>Building a premium version of you...</Text>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Manual path
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StepBar step={1} onBack={() => setPath('choose')} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.avatarPreview}>
          <AvatarDisplay avatar={config} level={1} size="xl" />
          <TextInput
            style={styles.nameInput}
            value={config.name}
            onChangeText={(v) => update('name', v)}
            placeholder="Character Name"
            placeholderTextColor={Colors.textMuted}
            maxLength={24}
          />
        </View>

        <Section title="Gender Presentation">
          <OptionRow options={AVATAR_OPTIONS.genderPresentation} selected={config.genderPresentation} onSelect={(v) => update('genderPresentation', v)} />
        </Section>

        <Section title="Skin Tone">
          <View style={styles.skinRow}>
            {AVATAR_OPTIONS.skinTones.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.skinBtn, { backgroundColor: SKIN_COLORS[t.id] }, config.skinTone === t.id && styles.skinActive]}
                onPress={() => update('skinTone', t.id)}
              />
            ))}
          </View>
        </Section>

        <Section title="Hairstyle">
          <OptionRow options={AVATAR_OPTIONS.hairstyles} selected={config.hairstyle} onSelect={(v) => update('hairstyle', v)} />
        </Section>

        <Section title="Clothing Style">
          <OptionRow options={AVATAR_OPTIONS.clothingStyles} selected={config.clothingStyle} onSelect={(v) => update('clothingStyle', v)} />
        </Section>

        <Section title="Body Type">
          <OptionRow options={AVATAR_OPTIONS.bodyTypes} selected={config.bodyType} onSelect={(v) => update('bodyType', v)} />
        </Section>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>Choose Categories</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

function StepBar({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
      </Pressable>
      <View style={styles.progressTrack}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.progressDot, i === step && styles.progressDotActive]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>2 of 4</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function OptionRow({ options, selected, onSelect }: {
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          style={[styles.optionChip, selected === o.id && styles.optionChipActive]}
          onPress={() => onSelect(o.id)}
        >
          <Text style={[styles.optionText, selected === o.id && styles.optionTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, paddingBottom: Spacing.md,
  },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceBorder },
  progressDotActive: { backgroundColor: Colors.gold, width: 18 },
  stepLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },

  // Choose path
  chooseContent: { flex: 1, padding: Spacing.xl, gap: Spacing.lg },
  chooseTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, lineHeight: 38 },
  chooseSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  pathCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder, position: 'relative',
  },
  pathCardPrimary: { borderColor: Colors.gold + '60', backgroundColor: Colors.goldSoft },
  pathCardIcon: {
    width: 54, height: 54, borderRadius: Radius.md,
    backgroundColor: Colors.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  pathCardText: { flex: 1, gap: 4 },
  pathCardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gold },
  pathCardSub: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  recommendedBadge: {
    position: 'absolute', top: -8, right: Spacing.md,
    backgroundColor: Colors.gold, borderRadius: Radius.round,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  recommendedText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textInverse },

  // Photo path
  photoContent: { flex: 1, padding: Spacing.xl, gap: Spacing.lg },
  photoZone: { alignItems: 'center', gap: Spacing.md },
  photoPlaceholder: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.surface, borderWidth: 2,
    borderColor: Colors.surfaceBorder, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  photoPlaceholderText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  photoPlaceholderSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, height: 52,
  },
  uploadBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textInverse },
  generatedPreview: { alignItems: 'center', gap: Spacing.sm },
  generatedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  generatedBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },
  regenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, height: 44,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  regenBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  skipPhotoBtn: { alignItems: 'center' },
  skipPhotoText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },

  // Generating modal
  generatingOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  generatingCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
    padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.gold + '30', minWidth: 280,
  },
  generatingTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  generatingSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Shared
  avatarPreview: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  nameFieldWrap: { gap: Spacing.xs, width: '100%' },
  nameLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  nameInput: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.surfaceBorder, height: 48, paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary,
    textAlign: 'center', minWidth: 200,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  skinRow: { flexDirection: 'row', gap: 12 },
  skinBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  skinActive: { borderColor: Colors.gold, transform: [{ scale: 1.15 }] },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.round,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  optionChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  optionText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  optionTextActive: { color: Colors.textInverse },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  nextBtn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  nextBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
