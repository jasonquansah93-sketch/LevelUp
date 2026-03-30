/**
 * AvatarBuilder — v7 (MVP free tier — stable 3-factor preview)
 *
 * ═══════════════════════════════════════════════════════════
 *  FREE TIER PREVIEW ARCHITECTURE
 * ═══════════════════════════════════════════════════════════
 *
 *  PRIMARY IMAGE — FACE / IDENTITY  (the ONLY visual layer)
 *  ────────────────────────────────────────────────────
 *  Source:    getAvatarImage(base, hairstyle, skinTone)
 *  Driven by: genderPresentation + hairstyle + skinTone ONLY
 *  60 pre-rendered PNGs encode skin tone + hairstyle.
 *
 *  INTENTIONALLY NOT VISUAL IN FREE TIER:
 *  ────────────────────────────────────────────────────
 *  bodyType     → saved to state/DB but does NOT alter the preview image
 *  clothingStyle → saved to state/DB but does NOT alter the preview image
 *
 *  Both appear as chip indicators below the avatar so users
 *  know their selection is saved. Premium AI Avatar Builder
 *  will unlock full visual customization in a future release.
 *
 * ═══════════════════════════════════════════════════════════
 *  VISUAL REACTIVITY MATRIX:
 *  genderPresentation → YES (base character swap)
 *  skinTone           → YES (image lookup)
 *  hairstyle          → YES (image lookup)
 *  bodyType           → NO  (chip only)
 *  clothingStyle      → NO  (chip only)
 * ═══════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  SKIN_TONES,
  CLOTHING_ACCENTS,
  CLOTHING_LABELS,
  genderToBase,
  getAvatarImage,
} from '@/constants/avatarAssets';
import { AvatarConfig } from '@/contexts/GameContext';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

// ─── FULL BUILDER PREVIEW ────────────────────────────────────────────────────

interface AvatarBuilderProps {
  config: AvatarConfig;
  /**
   * Height of the preview in px. Width is derived from the 2:3 aspect ratio.
   */
  size?: number;
  animate?: boolean;
}

export function AvatarBuilder({ config, size = 300, animate = true }: AvatarBuilderProps) {
  const base = genderToBase(config.genderPresentation);

  // ── PRIMARY IMAGE: Face / identity ────────────────────────────────────────
  // ONLY these 3 inputs drive the visible preview image.
  // bodyType and clothingStyle are intentionally excluded from the image lookup.
  const avatarImage = getAvatarImage(base, config.hairstyle, config.skinTone);

  // ── CHIP INDICATORS (non-visual preferences) ────────────────────────────────
  // Clothing and body type are saved in state/DB but do NOT change the image.
  const clothingAccent = CLOTHING_ACCENTS[config.clothingStyle] ?? CLOTHING_ACCENTS.casual;
  const clothingLabel  = CLOTHING_LABELS[config.clothingStyle]  ?? 'Casual';

  const BODY_TYPE_LABELS: Record<string, string> = {
    lean: 'Lean', average: 'Average', athletic: 'Athletic', broad: 'Broad',
  };
  const bodyLabel = BODY_TYPE_LABELS[config.bodyType] ?? 'Average';

  // Animation key — only the 3 visually-reactive factors.
  // clothingStyle and bodyType changes do NOT trigger the flash animation.
  const configKey = `${config.genderPresentation}_${config.skinTone}_${config.hairstyle}`;
  const prevKey = useRef('');

  const flashAnim  = useRef(new Animated.Value(1)).current;
  const springAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate || prevKey.current === configKey) return;
    prevKey.current = configKey;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(flashAnim,  { toValue: 0.72, duration: 60,  useNativeDriver: true }),
        Animated.timing(springAnim, { toValue: 0.97, duration: 60,  useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(flashAnim,  { toValue: 1,    duration: 180, useNativeDriver: true }),
        Animated.spring(springAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
      ]),
    ]).start();
  }, [configKey]);

  // Canvas: 2:3 ratio, height controlled by `size` prop
  const containerHeight = size;
  const containerWidth  = size * (2 / 3);

  return (
    <View style={[styles.root, { width: containerWidth + 40, height: containerHeight + 36 }]}>
      {/*
        LAYER 1: Face / identity image with body-type scale modifier.
        key forces a remount when image source changes, preventing stale renders.
      */}
      <Animated.View
        style={[
          styles.avatarWrap,
          {
            width: containerWidth,
            height: containerHeight,
            opacity: flashAnim,
            transform: [{ scale: springAnim }],
          },
        ]}
      >
        <Image
          key={`face_${base}_${config.hairstyle}_${config.skinTone}`}
          source={avatarImage}
          style={{ width: containerWidth, height: containerHeight }}
          contentFit="contain"
          transition={160}
        />
      </Animated.View>

      {/* Non-visual preference chips — clothing & body type */}
      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: clothingAccent + '18', borderColor: clothingAccent + '55' }]}>
          <View style={[styles.chipDot, { backgroundColor: clothingAccent }]} />
          <Text style={[styles.chipText, { color: clothingAccent }]}>{clothingLabel}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: Colors.textMuted + '18', borderColor: Colors.textMuted + '55' }]}>
          <MaterialIcons name="accessibility" size={9} color={Colors.textMuted} />
          <Text style={[styles.chipText, { color: Colors.textMuted }]}>{bodyLabel}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── COMPACT DISPLAY VARIANT ──────────────────────────────────────────────────
// Used in tabs, profile header, leaderboard rows, etc.
// Shows the avatar inside a soft circular frame — no mismatched overlays.

interface AvatarDisplayCompactProps {
  avatar: AvatarConfig;
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
}

const DISPLAY_SIZES = {
  sm: 44,
  md: 64,
  lg: 96,
  xl: 130,
} as const;

export function AvatarDisplay({
  avatar,
  level,
  size = 'md',
  showLevel = true,
}: AvatarDisplayCompactProps) {
  const outerSize = DISPLAY_SIZES[size];
  const levelFontSize = outerSize < 50 ? 9 : outerSize < 80 ? 10 : 12;
  const skinColor = SKIN_TONES[avatar.skinTone]?.color ?? SKIN_TONES.tone2.color;

  // AI-generated photo takes priority
  if (avatar.photoUrl) {
    return (
      <View style={{ width: outerSize, height: outerSize }}>
        <Image
          source={{ uri: avatar.photoUrl }}
          style={{
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderWidth: 2,
            borderColor: Colors.gold + '80',
          }}
          contentFit="cover"
          transition={200}
        />
        {showLevel && (
          <View
            style={[
              dStyles.levelBadge,
              {
                minWidth: outerSize * 0.32,
                height: outerSize * 0.32,
                borderRadius: outerSize * 0.16,
              },
            ]}
          >
            <Text style={[dStyles.levelText, { fontSize: levelFontSize }]}>{level}</Text>
          </View>
        )}
      </View>
    );
  }

  // Compact display uses face/identity image as primary (matches builder preview)
  // base + hairstyle + skinTone → same logic as the full AvatarBuilder
  const avatarBase = avatar.genderPresentation === 'feminine' ? 'f' : 'm';
  const avatarImg = getAvatarImage(avatarBase, avatar.hairstyle, avatar.skinTone);

  return (
    <View style={{ width: outerSize, height: outerSize }}>
      {/* Soft skin-tinted circular background */}
      <View
        style={[
          dStyles.circle,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: skinColor + '30',
            borderColor: skinColor + '60',
          },
        ]}
      >
        {/* Avatar image — scaled to show upper body + head prominently */}
        <View
          style={{
            width: outerSize * 1.1,
            height: outerSize * 1.4,
            marginTop: -outerSize * 0.12,
          }}
        >
          <Image
            source={avatarImg}
            style={{ width: outerSize * 1.1, height: outerSize * 1.4 }}
            contentFit="contain"
            transition={80}
          />
        </View>
      </View>

      {showLevel && (
        <View
          style={[
            dStyles.levelBadge,
            {
              minWidth: outerSize * 0.32,
              height: outerSize * 0.32,
              borderRadius: outerSize * 0.16,
            },
          ]}
        >
          <Text style={[dStyles.levelText, { fontSize: levelFontSize }]}>{level}</Text>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    // NO background — container transparent so silhouette appears cut out
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    // NO overflow: 'hidden' — must not clip transparent PNG edges
  },
  // Non-visual preference chips row
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
});

const dStyles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 14,
  },
});
