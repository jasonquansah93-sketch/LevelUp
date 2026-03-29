/**
 * AvatarBuilder — v6 (all-selectors fix)
 *
 * ═══════════════════════════════════════════════════════════
 *  RENDER ARCHITECTURE  (read before modifying)
 * ═══════════════════════════════════════════════════════════
 *
 *  LAYER 1 — FACE / IDENTITY IMAGE  (primary)
 *  ────────────────────────────────────────────────────
 *  Source:   getAvatarImage(base, hairstyle, skinTone)
 *  Driven by: genderPresentation + hairstyle + skinTone
 *  These 60 pre-rendered PNGs encode skin tone + hairstyle.
 *  Any change to gender, skin, or hair swaps this image.
 *
 *  LAYER 1 MODIFIER — BODY TYPE SCALE
 *  ────────────────────────────────────────────────────
 *  Applied as scaleX / scaleY CSS transform on the face image.
 *  Driven by: bodyType  (lean / average / athletic / broad)
 *  Rule: scale only — never replaces the face image source.
 *
 *  LAYER 2 — CLOTHING EXTENSION (style chip indicator)
 *  ────────────────────────────────────────────────────
 *  Method:  Styled pill label below the avatar.
 *  Rule:    NEVER replaces or overlays the primary image.
 *
 * ═══════════════════════════════════════════════════════════
 *  ALL 5 SELECTORS UPDATE THE PREVIEW:
 *  genderPresentation → base char for face image
 *  skinTone           → face image lookup
 *  hairstyle          → face image lookup
 *  bodyType           → scaleX/scaleY transform on face image
 *  clothingStyle      → chip indicator label + colour
 * ═══════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native';
import {
  SKIN_TONES,
  BODY_TYPE_SCALES,
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

  // ── LAYER 1: Face / identity image ─────────────────────────────────────────
  // Driven by base + hairstyle + skinTone — all three must be in the lookup.
  // Any of these three changing produces a different image → visible update.
  const avatarImage = getAvatarImage(base, config.hairstyle, config.skinTone);

  // ── LAYER 1 MODIFIER: Body type scale ──────────────────────────────────────
  // Applies scaleX / scaleY to the face image to adjust silhouette width.
  // Does NOT swap the image source — body type is purely a CSS transform here.
  const bodyScale = BODY_TYPE_SCALES[config.bodyType] ?? BODY_TYPE_SCALES.average;

  // ── LAYER 2: Clothing style chip ────────────────────────────────────────────
  const clothingAccent = CLOTHING_ACCENTS[config.clothingStyle] ?? CLOTHING_ACCENTS.casual;
  const clothingLabel  = CLOTHING_LABELS[config.clothingStyle]  ?? 'Casual';

  // Derived preview key — ALL 5 selector values included.
  // Any selector change produces a new key → animation fires + image recomputed.
  const configKey = `${config.genderPresentation}_${config.skinTone}_${config.hairstyle}_${config.clothingStyle}_${config.bodyType}`;
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
            transform: [
              { scale: springAnim },
              { scaleX: bodyScale.scaleX },
              { scaleY: bodyScale.scaleY },
            ],
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

      {/* LAYER 2: Clothing style indicator chip */}
      <View style={[styles.clothingChip, { backgroundColor: clothingAccent + '22', borderColor: clothingAccent + '66' }]}>
        <View style={[styles.clothingDot, { backgroundColor: clothingAccent }]} />
        <Text style={[styles.clothingChipText, { color: clothingAccent }]}>{clothingLabel}</Text>
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
  // Clothing style indicator — sits below avatar, clearly separate from image
  clothingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  clothingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  clothingChipText: {
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
