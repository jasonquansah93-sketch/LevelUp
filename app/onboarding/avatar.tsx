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
import { AVATAR_OPTIONS } from '@/constants/gameData';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { getSupabaseClient } from '@/template';

type CreationPath = 'starter' | 'photo' | 'manual';
type GenerationState = 'idle' | 'generating' | 'done' | 'error';

const SKIN_COLORS: Record<string, string> = {
  tone1: '#FDDBB4', tone2: '#F0C27F', tone3: '#C68642',
  tone4: '#8D5524', tone5: '#5C3317', tone6: '#3B1F0B',
};

const CLOTHING_COLORS: Record<string, string> = {
  casual: '#8A6A4A', athletic: '#4A6A8A', business: '#3D4F7A', streetwear: '#5A6A4A',
};

const HAIR_OFFSETS: Record<string, number> = {
  short: 0, medium: 4, long: 8, buzz: -3, bald: -6,
};

const GENERATION_STEPS = [
  'Uploading your photo...',
  'Analyzing features...',
  'Building your character...',
  'Adding finishing touches...',
  'Almost ready...',
];

// ─── ANIMATED AVATAR PREVIEW ─────────────────────────────────────────────────

function LiveAvatarPreview({ config, size = 160 }: { config: AvatarConfig; size?: number }) {
  const skinColor = SKIN_COLORS[config.skinTone] || SKIN_COLORS.tone2;
  const clothingColor = CLOTHING_COLORS[config.clothingStyle] || CLOTHING_COLORS.casual;
  const hairOffset = HAIR_OFFSETS[config.hairstyle] || 0;
  const isFeminine = config.genderPresentation === 'feminine';
  const isNeutral = config.genderPresentation === 'neutral';
  const isBroad = config.bodyType === 'broad' || config.bodyType === 'athletic';
  const isLean = config.bodyType === 'lean';
  const hasBaldHair = config.hairstyle === 'bald';

  const bodyWidth = isBroad ? size * 0.5 : isLean ? size * 0.35 : size * 0.42;
  const headSize = size * 0.36;
  const shoulderCurve = isFeminine ? size * 0.08 : Radius.sm;

  return (
    <View style={[avStyles.container, { width: size, height: size }]}>
      {/* Body / Torso */}
      <View style={[
        avStyles.body,
        {
          width: bodyWidth,
          height: size * 0.44,
          backgroundColor: clothingColor,
          borderRadius: shoulderCurve,
          bottom: 0,
        }
      ]} />

      {/* Neck */}
      <View style={[
        avStyles.neck,
        {
          width: size * 0.1,
          height: size * 0.1,
          backgroundColor: skinColor,
          bottom: size * 0.42,
        }
      ]} />

      {/* Head */}
      <View style={[
        avStyles.head,
        {
          width: headSize,
          height: headSize * (isFeminine ? 1.08 : 1.0),
          backgroundColor: skinColor,
          borderRadius: headSize * 0.5,
          bottom: size * 0.48,
        }
      ]}>
        {/* Eyes */}
        <View style={avStyles.eyeRow}>
          <View style={[avStyles.eye, { backgroundColor: clothingColor }]} />
          <View style={[avStyles.eye, { backgroundColor: clothingColor }]} />
        </View>
        {/* Mouth */}
        <View style={[avStyles.mouth, { borderBottomColor: clothingColor }]} />
      </View>

      {/* Hair */}
      {!hasBaldHair && (
        <View style={[
          avStyles.hair,
          {
            width: headSize + 4,
            height: headSize * 0.45 + hairOffset,
            backgroundColor: clothingColor,
            borderTopLeftRadius: headSize * 0.5,
            borderTopRightRadius: headSize * 0.5,
            bottom: size * 0.48 + headSize * (isFeminine ? 1.08 : 1.0) - headSize * 0.22,
          }
        ]} />
      )}

      {/* Feminine long hair strands */}
      {isFeminine && (config.hairstyle === 'long' || config.hairstyle === 'medium') && (
        <>
          <View style={[avStyles.hairStrand, {
            width: size * 0.07, height: size * 0.18,
            backgroundColor: clothingColor,
            left: size * 0.5 - bodyWidth / 2 - size * 0.07,
            bottom: size * 0.42,
          }]} />
          <View style={[avStyles.hairStrand, {
            width: size * 0.07, height: size * 0.18,
            backgroundColor: clothingColor,
            right: size * 0.5 - bodyWidth / 2 - size * 0.07,
            bottom: size * 0.42,
          }]} />
        </>
      )}
    </View>
  );
}

const avStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  body: { position: 'absolute', left: undefined, alignSelf: 'center' },
  neck: { position: 'absolute', alignSelf: 'center', borderRadius: 4 },
  head: { position: 'absolute', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  eyeRow: { flexDirection: 'row', gap: 8, marginBottom: 6, marginTop: -8 },
  eye: { width: 6, height: 6, borderRadius: 3 },
  mouth: { width: 14, height: 7, borderBottomWidth: 2, borderBottomColor: '#888', borderRadius: 7 },
  hair: { position: 'absolute', alignSelf: 'center' },
  hairStrand: { position: 'absolute', borderRadius: 4 },
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function AvatarCreation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAvatar } = useGame();
  const { user, session } = useAuth();
  const supabase = getSupabaseClient();

  const [path, setPath] = useState<CreationPath>('starter');
  const [genState, setGenState] = useState<GenerationState>('idle');
  const [genStep, setGenStep] = useState(0);
  const [genError, setGenError] = useState('');
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [generatedPhotoUrl, setGeneratedPhotoUrl] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [config, setConfig] = useState<AvatarConfig>({
    genderPresentation: 'neutral',
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
    Animated.timing(progressAnim, {
      toValue, duration: 600, useNativeDriver: false,
    }).start();
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setGenError('Camera roll permission is required to pick a photo.');
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      console.error('Avatar generation error:', err);
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

  // ─── STARTER PATH (default) ────────────────────────────────────────────────
  if (path === 'starter') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StepBar step={1} total={4} onBack={() => router.back()} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Header */}
          <Text style={styles.pageTitle}>Create your character</Text>
          <Text style={styles.pageSub}>
            Customize your starter character. It grows as you level up.
          </Text>

          {/* Live character preview */}
          <View style={styles.previewCard}>
            <View style={styles.previewBg}>
              <LiveAvatarPreview config={config} size={180} />
            </View>
            <View style={styles.previewMeta}>
              <TextInput
                style={styles.nameInput}
                value={config.name}
                onChangeText={(v) => update('name', v)}
                placeholder="Character Name"
                placeholderTextColor={Colors.textMuted}
                maxLength={24}
              />
              <Text style={styles.previewHint}>Character updates live as you pick options below</Text>
            </View>
          </View>

          {/* Quick options */}
          <Section title="Gender Presentation">
            <OptionRow
              options={AVATAR_OPTIONS.genderPresentation}
              selected={config.genderPresentation}
              onSelect={(v) => update('genderPresentation', v)}
            />
          </Section>

          <Section title="Skin Tone">
            <View style={styles.skinRow}>
              {AVATAR_OPTIONS.skinTones.map((t) => (
                <Pressable
                  key={t.id}
                  style={[
                    styles.skinBtn,
                    { backgroundColor: SKIN_COLORS[t.id] },
                    config.skinTone === t.id && styles.skinActive,
                  ]}
                  onPress={() => update('skinTone', t.id)}
                />
              ))}
            </View>
          </Section>

          <Section title="Hairstyle">
            <OptionRow
              options={AVATAR_OPTIONS.hairstyles}
              selected={config.hairstyle}
              onSelect={(v) => update('hairstyle', v)}
            />
          </Section>

          <Section title="Clothing Style">
            <OptionRow
              options={AVATAR_OPTIONS.clothingStyles}
              selected={config.clothingStyle}
              onSelect={(v) => update('clothingStyle', v)}
            />
          </Section>

          <Section title="Body Type">
            <OptionRow
              options={AVATAR_OPTIONS.bodyTypes}
              selected={config.bodyType}
              onSelect={(v) => update('bodyType', v)}
            />
          </Section>

          {/* Premium photo upsell */}
          <Pressable
            style={({ pressed }) => [styles.premiumBanner, pressed && styles.pressed]}
            onPress={() => setPath('photo')}
          >
            <View style={styles.premiumBannerLeft}>
              <View style={styles.premiumBannerIcon}>
                <MaterialIcons name="auto-awesome" size={18} color={Colors.gold} />
              </View>
              <View>
                <View style={styles.premiumBannerRow}>
                  <Text style={styles.premiumBannerTitle}>Generate from your photo</Text>
                  <View style={styles.premiumPill}>
                    <Text style={styles.premiumPillText}>Premium</Text>
                  </View>
                </View>
                <Text style={styles.premiumBannerSub}>
                  AI creates a stylized character portrait based on you
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

  // ─── PHOTO / PREMIUM PATH ──────────────────────────────────────────────────
  if (path === 'photo') {
    const isDone = genState === 'done';
    const isGenerating = genState === 'generating';
    const isError = genState === 'error';

    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}>
        <StepBar step={1} total={4} onBack={() => { resetGeneration(); setPickedImageUri(null); setPath('starter'); }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
          {/* Premium badge */}
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

          {/* Photo upload / preview area */}
          <View style={styles.photoPreviewArea}>
            {isDone && generatedPhotoUrl ? (
              <View style={styles.generatedResult}>
                <Image
                  source={{ uri: generatedPhotoUrl }}
                  style={styles.generatedImage}
                  contentFit="cover"
                  transition={400}
                />
                <View style={styles.generatedBadge}>
                  <MaterialIcons name="auto-awesome" size={12} color={Colors.gold} />
                  <Text style={styles.generatedBadgeText}>AI Generated</Text>
                </View>
                {pickedImageUri && (
                  <View style={styles.compareRow}>
                    <View style={styles.compareItem}>
                      <Image source={{ uri: pickedImageUri }} style={styles.compareThumb} contentFit="cover" />
                      <Text style={styles.compareLabel}>Your photo</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={18} color={Colors.textMuted} />
                    <View style={styles.compareItem}>
                      <Image source={{ uri: generatedPhotoUrl }} style={styles.compareThumb} contentFit="cover" />
                      <Text style={styles.compareLabel}>Your character</Text>
                    </View>
                  </View>
                )}
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

          {(isDone || pickedImageUri) && !isGenerating && (
            <View style={styles.nameField}>
              <Text style={styles.nameLabel}>Character Name</Text>
              <TextInput
                style={styles.nameInputPhoto}
                value={config.name}
                onChangeText={(v) => update('name', v)}
                placeholder="Your character name"
                placeholderTextColor={Colors.textMuted}
                maxLength={24}
              />
            </View>
          )}

          {pickedImageUri && !isDone && !isGenerating && (
            <View style={styles.styleSection}>
              <Text style={styles.styleSectionTitle}>Outfit style for generation</Text>
              <View style={styles.optionRow}>
                {AVATAR_OPTIONS.clothingStyles.map((o) => (
                  <Pressable
                    key={o.id}
                    style={[styles.optionChip, config.clothingStyle === o.id && styles.optionChipActive]}
                    onPress={() => update('clothingStyle', o.id)}
                  >
                    <Text style={[styles.optionText, config.clothingStyle === o.id && styles.optionTextActive]}>
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer */}
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
              <Pressable style={styles.skipBtn} onPress={() => setPath('starter')}>
                <Text style={styles.skipBtnText}>Use starter character instead</Text>
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
              <View style={styles.genSteps}>
                {GENERATION_STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.genStepDot,
                      i < genStep && styles.genStepDotDone,
                      i === genStep && styles.genStepDotActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.genHint}>This takes about 15–30 seconds</Text>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // fallback (should not reach)
  return null;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function StepBar({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textSecondary} />
      </Pressable>
      <View style={styles.progressTrack}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.progressDot, i === step && styles.progressDotActive]} />
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

// ─── STYLES ──────────────────────────────────────────────────────────────────

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

  scroll: { padding: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.lg },
  pageTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, lineHeight: 38 },
  pageSub: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

  // Live preview card
  previewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden',
  },
  previewBg: {
    backgroundColor: Colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
    paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
    minHeight: 220,
  },
  previewMeta: {
    padding: Spacing.md, gap: Spacing.xs, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  previewHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.goldSoft, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.gold + '50',
    gap: Spacing.md, marginTop: Spacing.sm,
  },
  premiumBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  premiumBannerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.goldSoft, borderWidth: 1.5, borderColor: Colors.gold + '60',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumBannerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  premiumBannerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gold },
  premiumBannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16, marginTop: 2 },
  premiumPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gold, borderRadius: Radius.round,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumPillText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textInverse },
  premiumHeader: { gap: Spacing.sm },

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

  // Photo path
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
  generatedImage: {
    width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: Colors.gold,
  },
  generatedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.goldSoft, borderRadius: Radius.round,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.gold + '40',
  },
  generatedBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },
  compareRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, width: '100%',
  },
  compareItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  compareThumb: { width: 60, height: 60, borderRadius: 30 },
  compareLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.errorSoft, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.error + '40',
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, flex: 1, lineHeight: 20 },
  nameField: { gap: Spacing.xs },
  nameLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  nameInputPhoto: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.surfaceBorder, height: 48, paddingHorizontal: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  styleSection: { gap: Spacing.sm },
  styleSectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Generation overlay
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
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.goldSoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.gold + '50',
  },
  genTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  genStep: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  genProgressTrack: {
    width: '100%', height: 6, backgroundColor: Colors.surfaceBorder,
    borderRadius: 3, overflow: 'hidden',
  },
  genProgressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },
  genSteps: { flexDirection: 'row', gap: 6 },
  genStepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceBorder },
  genStepDotActive: { backgroundColor: Colors.gold, width: 20 },
  genStepDotDone: { backgroundColor: Colors.success },
  genHint: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Shared footer
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
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, height: 56,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  regenBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipBtnText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  nameInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.surfaceBorder, height: 44, paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary,
    textAlign: 'center', minWidth: 180,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
