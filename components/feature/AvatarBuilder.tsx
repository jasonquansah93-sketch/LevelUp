/**
 * AvatarBuilder — v4 (stable layered architecture)
 *
 * ═══════════════════════════════════════════════════════════
 *  RENDER ARCHITECTURE  (read before modifying)
 * ═══════════════════════════════════════════════════════════
 *
 *  LAYER 1 — PRIMARY IDENTITY (drives the main image)
 *  ────────────────────────────────────────────────────
 *  Source file:  body_{base}_{hair}_{tone}.png
 *  Driven by:    genderPresentation + hairstyle + skinTone
 *  These three selectors always control the visible avatar.
 *  They MUST NOT be overridden by extension layers.
 *
 *  LAYER 2 — BODY TYPE EXTENSION (CSS scale on primary image)
 *  ────────────────────────────────────────────────────────────
 *  Method:  scaleX + scaleY transform on the primary image.
 *  Values:  lean 0.88 / average 1.00 / athletic 1.06 / broad 1.14
 *  Rule:    NEVER swaps the primary image for a different PNG.
 *
 *  LAYER 3 — CLOTHING EXTENSION (style chip indicator)
 *  ────────────────────────────────────────────────────
 *  Method:  Styled pill label below the avatar.
 *  Rule:    NEVER replaces the primary image source.
 *           Dedicated clothing PNGs exist in assets but are
 *           reserved for a future explicit clothing-overlay layer.
 *
 * ═══════════════════════════════════════════════════════════
 *  STABLE PRIMARY SOURCE:  getAvatarImage(base, hairstyle, skinTone)
 *  Clothing & Body Type are EXTENSIONS — they never replace it.
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

  // ── LAYER 1: Primary identity image (base + hairstyle + skin tone) ──────────
  // This is the ONLY source that drives the main avatar visual.
  // Clothing and body type never replace this.
  const avatarImage = getAvatarImage(base, config.hairstyle, config.skinTone);

  // ── LAYER 2: Body type extension (scale transform on primary image) ──────────
  // Meaningful scale differences so each body type is visually distinct.
  const bodyScale = BODY_TYPE_SCALES[config.bodyType] ?? BODY_TYPE_SCALES.average;

  // ── LAYER 3: Clothing extension (indicator only — does NOT replace image) ────
  const clothingAccent = CLOTHING_ACCENTS[config.clothingStyle] ?? CLOTHING_ACCENTS.casual;
  const clothingLabel  = CLOTHING_LABELS[config.clothingStyle]  ?? 'Casual';

  // Config key — any selector change triggers the feedback animation
  const configKey = `${base}_${config.skinTone}_${config.hairstyle}_${config.clothingStyle}_${config.bodyType}`;
  const prevKey = useRef('');

  const flashAnim = useRef(new Animated.Value(1)).current;
  const springAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate || prevKey.current === configKey) return;
    prevKey.current = configKey;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(flashAnim, { toValue: 0.72, duration: 60, useNativeDriver: true }),
        Animated.timing(springAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(flashAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(springAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]),
    ]).start();
  }, [configKey]);

  // Canvas: 2:3 ratio, controlled by `size` (= height)
  const containerHeight = size;
  const containerWidth  = size * (2 / 3);

  return (
    <View style={[styles.root, { width: containerWidth + 40, height: containerHeight + 36 }]}>
      {/* ── LAYER 1 + 2: Primary avatar image with body-type scale ─────────── */}
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
        {/* Body type scale is applied here — it stretches the PRIMARY image only */}
        <Animated.View
          style={{
            width: containerWidth,
            height: containerHeight,
            transform: [
              { scaleX: bodyScale.scaleX },
              { scaleY: bodyScale.scaleY },
            ],
          }}
        >
          <Image
            key={`avatar_${base}_${config.hairstyle}_${config.skinTone}`}
            source={avatarImage}
            style={{ width: containerWidth, height: containerHeight }}
            contentFit="contain"
            transition={140}
          />
        </Animated.View>
      </Animated.View>

      {/* ── LAYER 3: Clothing style indicator chip ────────────────────────── */}
      {/* This chip shows the active clothing style without replacing the image */}
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

  const base = genderToBase(avatar.genderPresentation);
  const avatarImg = getAvatarImage(base, avatar.hairstyle, avatar.skinTone);
  const bodyScale = BODY_TYPE_SCALES[avatar.bodyType] ?? BODY_TYPE_SCALES.average;

  // The compact display: skin-tinted circle + avatar image inside, cropped to circle
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
        {/* Avatar image — scaled slightly to show upper body + head prominently */}
        <View
          style={{
            width: outerSize * 1.1,
            height: outerSize * 1.4,
            transform: [{ scaleX: bodyScale.scaleX }],
            marginTop: -outerSize * 0.12, // shift up so head is centered in circle
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
