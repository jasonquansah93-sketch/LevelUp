/**
 * AvatarBuilder — v5 (asset-based body type)
 *
 * ═══════════════════════════════════════════════════════════
 *  RENDER ARCHITECTURE  (read before modifying)
 * ═══════════════════════════════════════════════════════════
 *
 *  LAYER 1 — PRIMARY IMAGE: BODY TYPE ASSET
 *  ────────────────────────────────────────────────────
 *  Source file:  {gender}_body_{bodyType}.png
 *  Driven by:    genderPresentation + bodyType
 *  These are true dedicated body-type PNGs — NOT scale transforms.
 *  Lean / Average / Athletic / Broad each have their own asset.
 *  Rule: NO scaleX/scaleY hacks. Body type is purely asset-driven.
 *
 *  LAYER 2 — CLOTHING EXTENSION (style chip indicator)
 *  ────────────────────────────────────────────────────
 *  Method:  Styled pill label below the avatar.
 *  Rule:    NEVER replaces the primary image source.
 *
 * ═══════════════════════════════════════════════════════════
 *  PRIMARY SOURCE:  getBodyTypeImage(genderPresentation, bodyType)
 *  Clothing is an EXTENSION chip — it never replaces it.
 *  Skin tone + hairstyle selectors persist to config/DB for
 *  future composite rendering; body type drives the preview.
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
  getBodyTypeImage,
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

  // ── LAYER 1: Body-type asset — dedicated PNG per body type ──────────────────
  // lean / average / athletic / broad each have their own full-body transparent PNG.
  // This is the PRIMARY image. No scaleX/scaleY transforms are applied to it.
  // Skin tone + hairstyle chips persist to config/DB; body type drives the preview.
  const avatarImage = getBodyTypeImage(config.genderPresentation, config.bodyType);

  // ── LAYER 2: Clothing extension (indicator chip only) ────────────────────────
  const clothingAccent = CLOTHING_ACCENTS[config.clothingStyle] ?? CLOTHING_ACCENTS.casual;
  const clothingLabel  = CLOTHING_LABELS[config.clothingStyle]  ?? 'Casual';

  // Config key — any selector change triggers the feedback animation
  const configKey = `${base}_${config.bodyType}_${config.clothingStyle}_${config.skinTone}_${config.hairstyle}`;
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
      {/* ── LAYER 1: Body-type asset — no transform scaling ─────────────────── */}
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
        {/* Dedicated body-type PNG — silhouette is baked into the asset, not CSS */}
        <Image
          key={`bodytype_${base}_${config.bodyType}`}
          source={avatarImage}
          style={{ width: containerWidth, height: containerHeight }}
          contentFit="contain"
          transition={160}
        />
      </Animated.View>

      {/* ── LAYER 2: Clothing style indicator chip ────────────────────────── */}
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

  // Compact display uses body-type asset as primary (matches builder preview)
  const avatarImg = getBodyTypeImage(avatar.genderPresentation, avatar.bodyType);

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
