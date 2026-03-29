import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  Modal, ActivityIndicator, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/hooks/useAuth';
import { AvatarConfig } from '@/contexts/GameContext';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { getSupabaseClient } from '@/template';
import { AvatarBuilder } from '@/components/feature/AvatarBuilder';
import { SKIN_TONES, SKIN_TONE_ORDER, CLOTHING_ACCENTS, CLOTHING_LABELS } from '@/constants/avatarAssets';

type CreationPath = 'builder' | 'photo';
type GenerationState = 'idle' | 'generating' | 'done' | 'error';

const GENERATION_STEPS = [
  'Uploading your photo...',
  'Analyzing features...',
  'Building your character...',
  'Adding finishing touches...',
  'Almost ready...',
];

// Only 2 base characters exist — Neutral has been removed.
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

export default function AvatarCreation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAvatar } = useGame();
  const { user, session } = useAuth();
  const supabase = getSupabaseClient();

  const [path, setPath] = useState<CreationPath>('builder');
  const [genState, setGenState] = useState<GenerationState>('idle');
  const [genStep, setGenStep] = useState(0);
  const [genError, setGenError] = useState('');
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [generatedPhotoUrl, setGeneratedPhotoUrl] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [config, setConfig] = useState<AvatarConfig>({
    genderPresentation: 'masculine', // default to masculine (no neutral)
    skinTone: 'tone2',
    hairstyle: 'short',
    clothingStyle: 'casual',
    bodyType: 'average',
    name: user?.displayName?.split(' ')[0] || 'My Character',
    photoUrl: undefined,
  });

  const update = (key: keyof AvatarConfig, value: string) =>
    setConfig((p) => ({ ...p, [key]: value }));

  const handleNext = async () => {
    const finalConfig = generatedPhotoUrl
      ? { ...config, photoUrl: generatedPhotoUrl }
      : config;
    await setAvatar(finalConfig);
    router.push('/onboarding/categories');
  };

  const animateProgress = (toValue: number) => {
    Animated.timing(progressAnim, { toValue, duration: 600, useNativeDriver: false }).start();
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setGenError('Camera roll permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedImageUri(result.assets[0].uri);
      setGenError('');
    }
  };

  const generateAvatar = async () => {
    if (!pickedImageUri) return;
    setGenState('generating');
    setGenError('');
    setGenStep(0);
    animateProgress(0.1);
    try {
      setGenStep(0); animateProgress(0.2);
      const base64 = await FileSystem.readAsStringAsync(pickedImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const photoBase64 = `data:image/jpeg;base64,${base64}`;
      setGenStep(1); animateProgress(0.35);
      await new Promise((r) => setTimeout(r, 400));
      setGenStep(2); animateProgress(0.55);

      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          photoBase64,
          style: `${config.clothingStyle} style, ${config.genderPresentation} presentation`,
          avatarName: config.name,
        }),
      });
      setGenStep(3); animateProgress(0.8);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Generation failed');
      }
      const data = await response.json();
      if (!data.publicUrl) throw new Error('No image URL returned');
      setGenStep(4); animateProgress(1.0);
      await new Promise((r) => setTimeout(r, 500));
      setGeneratedPhotoUrl(data.publicUrl);
      setGenState('done');
    } catch (err: any) {
      setGenError(err.message || 'Generation failed. Please try again.');
      setGenState('error');
    }
  };

  const resetGeneration = () => {
    setGenState('idle');
    setGenStep(0);
    setGenError('');
    setGeneratedPhotoUrl(null);
    progressAnim.setValue(0);
  };

  // ─── BUILDER PATH (default) ───────────────────────────────────────────────

  if (path === 'builder') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StepBar onBack={() => router.back()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* HEADER */}
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>Create your character</Text>
            <Text style={styles.pageSub}>
              Tap any option to see your character update live.
            </Text>
          </View>

          {/* AVATAR PREVIEW — the star of the screen */}
          <View style={styles.previewCard}>
            {/* Name input row */}
            <View style={styles.previewTopRow}>
              <TextInput
                style={styles.nameInput}
                value={config.name}
                onChangeText={(v) => update('name', v)}
                placeholder="Character name"
                placeholderTextColor={Colors.textMuted}
                maxLength={24}
              />
            </View>

            {/* Live avatar — transparent container, no white box */}
            <View style={styles.previewStage}>
              <AvatarBuilder config={config} size={270} animate />
              <Text style={styles.previewHint}>
                Your character updates live as you choose options below
              </Text>
            </View>
          </View>

          {/* BASE CHARACTER */}
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
                      size={16}
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

          {/* SKIN TONE */}
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
                      <MaterialIcons name="check" size={14} color={toneId === 'tone1' ? '#888' : '#fff'} />
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.skinLabel}>
              {SKIN_TONES[config.skinTone]?.label ?? ''}
            </Text>
          </Section>

          {/* HAIRSTYLE */}
          <Section title="Hairstyle">
            <ChipRow
              options={HAIRSTYLE_OPTIONS}
              selected={config.hairstyle}
              onSelect={(v) => update('hairstyle', v)}
            />
          </Section>

          {/* CLOTHING */}
          <Section title="Clothing Style">
            <ChipRow
              options={CLOTHING_OPTIONS}
              selected={config.clothingStyle}
              onSelect={(v) => update('clothingStyle', v)}
              accentColor={CLOTHING_ACCENTS[config.clothingStyle]}
            />
          </Section>

          {/* BODY TYPE */}
          <Section title="Body Type">
            <ChipRow
              options={BODY_OPTIONS}
              selected={config.bodyType}
              onSelect={(v) => update('bodyType', v)}
            />
          </Section>

          {/* PREMIUM PHOTO UPSELL */}
          <Pressable
            style={({ pressed }) => [styles.premiumBanner, pressed && styles.pressed]}
            onPress={() => setPath('photo')}
          >
            <View style={styles.premiumBannerLeft}>
              <View style={styles.premiumBannerIcon}>
                <MaterialIcons name="auto-awesome" size={18} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.premiumBannerRow}>
                  <Text style={styles.premiumBannerTitle}>Generate from your photo</Text>
                  <View style={styles.premiumPill}>
                    <MaterialIcons name="auto-awesome" size={9} color={Colors.textInverse} />
                    <Text style={styles.premiumPillText}>Premium</Text>
                  </View>
                </View>
                <Text style={styles.premiumBannerSub}>
                  AI creates a stylized portrait from your actual face
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={14} color={Colors.gold} />
          </Pressable>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
            onPress={() => void handleNext()}
          >
            <Text style={styles.nextBtnText}>Choose Categories</Text>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── PHOTO / PREMIUM PATH ─────────────────────────────────────────────────

  const isDone = genState === 'done';
  const isGenerating = genState === 'generating';
  const isError = genState === 'error';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}>
      <StepBar onBack={() => { resetGeneration(); setPickedImageUri(null); setPath('builder'); }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
        <View style={styles.premiumHeader}>
          <View style={styles.premiumPill}>
            <MaterialIcons name="auto-awesome" size={11} color={Colors.gold} />
            <Text style={styles.premiumPillText}>Premium Feature</Text>
          </View>
          <Text style={styles.pageTitle}>Generate from photo</Text>
          <Text style={styles.pageSub}>
            Upload a portrait or selfie. AI builds a premium stylized character that captures your look.
          </Text>
        </View>

        <View style={styles.photoPreviewArea}>
          {isDone && generatedPhotoUrl ? (
            <View style={styles.generatedResult}>
              <Image source={{ uri: generatedPhotoUrl }} style={styles.generatedImage} contentFit="cover" transition={400} />
              <View style={styles.generatedBadge}>
                <MaterialIcons name="auto-awesome" size={12} color={Colors.gold} />
                <Text style={styles.generatedBadgeText}>AI Generated</Text>
              </View>
            </View>
          ) : pickedImageUri ? (
            <View style={styles.pickedPreview}>
              <Image source={{ uri: pickedImageUri }} style={styles.pickedImage} contentFit="cover" />
              <Pressable
                style={({ pressed }) => [styles.changePhotoBtn, pressed && styles.pressed]}
                onPress={pickPhoto}
                disabled={isGenerating}
              >
                <MaterialIcons name="swap-horiz" size={16} color={Colors.textSecondary} />
                <Text style={styles.changePhotoBtnText}>Change photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.photoDropZone, pressed && styles.pressed]}
              onPress={pickPhoto}
            >
              <View style={styles.photoDropIcon}>
                <MaterialIcons name="add-a-photo" size={36} color={Colors.gold} />
              </View>
              <Text style={styles.photoDropTitle}>Upload a photo</Text>
              <Text style={styles.photoDropSub}>Portrait or selfie works best</Text>
            </Pressable>
          )}
        </View>

        {isError && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{genError}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {isDone ? (
          <View style={styles.footerRow}>
            <Pressable
              style={({ pressed }) => [styles.regenBtn, pressed && styles.pressed]}
              onPress={resetGeneration}
            >
              <MaterialIcons name="refresh" size={18} color={Colors.textSecondary} />
              <Text style={styles.regenBtnText}>Redo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.nextBtn, styles.nextBtnFlex, pressed && styles.pressed]}
              onPress={() => void handleNext()}
            >
              <Text style={styles.nextBtnText}>Choose Categories</Text>
              <MaterialIcons name="arrow-forward" size={20} color={Colors.textInverse} />
            </Pressable>
          </View>
        ) : pickedImageUri ? (
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed, isGenerating && styles.btnDisabled]}
            onPress={() => void generateAvatar()}
            disabled={isGenerating}
          >
            {isGenerating
              ? <ActivityIndicator color={Colors.textInverse} size="small" />
              : <MaterialIcons name="auto-awesome" size={20} color={Colors.textInverse} />}
            <Text style={styles.nextBtnText}>
              {isGenerating ? 'Generating...' : 'Generate My Character'}
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
              onPress={pickPhoto}
            >
              <MaterialIcons name="photo-library" size={20} color={Colors.textInverse} />
              <Text style={styles.nextBtnText}>Choose from Camera Roll</Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={() => setPath('builder')}>
              <Text style={styles.skipBtnText}>Use character builder instead</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Generation overlay */}
      <Modal transparent visible={isGenerating} animationType="fade">
        <View style={styles.genOverlay}>
          <View style={styles.genCard}>
            <View style={styles.genIconRing}>
              <MaterialIcons name="auto-awesome" size={32} color={Colors.gold} />
            </View>
            <Text style={styles.genTitle}>Creating your character</Text>
            <Text style={styles.genStep}>{GENERATION_STEPS[genStep]}</Text>
            <View style={styles.genProgressTrack}>
              <Animated.View
                style={[
                  styles.genProgressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1], outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.genHint}>This takes about 15–30 seconds</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function StepBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
      </Pressable>
      <View style={styles.progressTrack}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.progressDot, i === 1 && styles.progressDotActive]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Step 2 of 4</Text>
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

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceBorder },
  progressDotActive: { backgroundColor: Colors.gold, width: 18 },
  stepLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.lg },
  headerBlock: { gap: 4 },
  pageTitle: {
    fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy,
    color: Colors.textPrimary, lineHeight: 38,
  },
  pageSub: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

  // ─ Preview card ────────────────────────────────────────────────────
  previewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden',
  },
  previewTopRow: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  previewStage: {
    // Soft warm gradient feel without a white box behind the avatar
    backgroundColor: Colors.goldSoft,
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 310,
    overflow: 'hidden',
  },
  previewHint: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 18,
  },
  nameInput: {
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold,
    color: Colors.textPrimary, textAlign: 'center',
    paddingVertical: Spacing.xs, minWidth: 160,
    borderBottomWidth: 1.5, borderBottomColor: Colors.gold + '60',
  },

  // ─ Sections ───────────────────────────────────────────────────────
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // ─ Gender ────────────────────────────────────────────────────────
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderChip: {
    flex: 1, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  genderChipActive: {
    backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary,
  },
  genderLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  genderLabelActive: { color: Colors.textInverse },

  // ─ Skin tone ─────────────────────────────────────────────────────
  skinRow: { flexDirection: 'row', gap: 10 },
  skinBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2.5, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  skinActive: { borderColor: Colors.gold, transform: [{ scale: 1.18 }] },
  skinLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // ─ Chip row ──────────────────────────────────────────────────────
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 16, height: 38, borderRadius: Radius.round,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textInverse },

  // ─ Premium banner ────────────────────────────────────────────────
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.goldSoft, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.gold + '50', gap: Spacing.md,
  },
  premiumBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  premiumBannerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.goldSoft, borderWidth: 1.5, borderColor: Colors.gold + '60',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumBannerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: 2 },
  premiumBannerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gold },
  premiumBannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  premiumPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gold, borderRadius: Radius.round,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumPillText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textInverse },
  premiumHeader: { gap: Spacing.sm },

  // ─ Photo path ────────────────────────────────────────────────────
  photoScroll: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 140 },
  photoPreviewArea: { alignItems: 'center' },
  photoDropZone: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.surface, borderWidth: 2,
    borderColor: Colors.gold + '50', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  photoDropIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  photoDropTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  photoDropSub: { fontSize: FontSize.sm, color: Colors.textMuted },
  pickedPreview: { alignItems: 'center', gap: Spacing.md },
  pickedImage: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: Colors.gold + '60' },
  changePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: Radius.round,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  changePhotoBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  generatedResult: { alignItems: 'center', gap: Spacing.lg, width: '100%' },
  generatedImage: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: Colors.gold },
  generatedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  generatedBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.errorSoft, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.error + '40',
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, flex: 1, lineHeight: 20 },

  // ─ Generation overlay ────────────────────────────────────────────
  genOverlay: {
    flex: 1, backgroundColor: 'rgba(237,232,223,0.92)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  genCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
    padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.gold + '40', width: '100%', maxWidth: 340,
  },
  genIconRing: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.goldSoft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.gold + '50',
  },
  genTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  genStep: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  genProgressTrack: {
    width: '100%', height: 6, backgroundColor: Colors.surfaceBorder, borderRadius: 3, overflow: 'hidden',
  },
  genProgressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },
  genHint: { fontSize: FontSize.xs, color: Colors.textMuted },

  // ─ Footer ─────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, gap: Spacing.sm,
  },
  footerRow: { flexDirection: 'row', gap: Spacing.sm },
  nextBtn: {
    backgroundColor: Colors.gold, height: 56, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  nextBtnFlex: { flex: 1 },
  nextBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  btnDisabled: { opacity: 0.5 },
  regenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, height: 56,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  regenBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipBtnText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
