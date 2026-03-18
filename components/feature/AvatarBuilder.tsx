/**
 * AvatarBuilder — Live modular avatar preview component (v2)
 *
 * Render architecture:
 * ┌─────────────────────────────────────┐
 * │  Body/clothing layer (full-body PNG) │  ← BODY_IMAGES[base_clothing]
 * │    • scaleX/Y for body type          │
 * │  Face portrait (bust PNG) overlaid   │  ← FACE_IMAGES[base_hair_tone]
 * │    • encodes both skin + hairstyle   │
 * │  Clothing accent bar (decorative)    │
 * └─────────────────────────────────────┘
 *
 * Changing ANY of: gender, skin tone, hairstyle, clothing, body type
 * immediately swaps the correct pre-rendered image — no tinting required.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import {
  BODY_IMAGES,
  FACE_IMAGES,
  SKIN_TONES,
  BODY_TYPE_SCALES,
  CLOTHING_ACCENTS,
  genderToBase,
  getFaceImage,
} from '@/constants/avatarAssets';
import { AvatarConfig } from '@/contexts/GameContext';
import { Colors, Radius } from '@/constants/theme';

// ─── FULL BUILDER PREVIEW ────────────────────────────────────────────────────

interface AvatarBuilderProps {
  config: AvatarConfig;
  /** Container height in px (width is derived proportionally) */
  size?: number;
  animate?: boolean;
}

export function AvatarBuilder({ config, size = 280, animate = true }: AvatarBuilderProps) {
  const base = genderToBase(config.genderPresentation);
  const bodyKey = `${base}_${config.clothingStyle}`;
  const bodyImage = BODY_IMAGES[bodyKey] ?? BODY_IMAGES[`${base}_casual`];
  const faceImage = getFaceImage(base, config.hairstyle, config.skinTone);
  const bodyScale = BODY_TYPE_SCALES[config.bodyType] ?? BODY_TYPE_SCALES.average;
  const clothingAccent = CLOTHING_ACCENTS[config.clothingStyle] ?? CLOTHING_ACCENTS.casual;

  // Flash-in animation on every option change
  const flashAnim = useRef(new Animated.Value(1)).current;
  const springAnim = useRef(new Animated.Value(1)).current;
  const configKey = `${base}_${config.skinTone}_${config.hairstyle}_${config.clothingStyle}_${config.bodyType}`;
  const prevKey = useRef('');

  useEffect(() => {
    if (!animate || prevKey.current === configKey) return;
    prevKey.current = configKey;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(flashAnim, { toValue: 0.7, duration: 70, useNativeDriver: true }),
        Animated.timing(springAnim, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(flashAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(springAnim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 8 }),
      ]),
    ]).start();
  }, [configKey]);

  const bodyWidth = size * 0.72;
  const bodyHeight = size;
  // Face portrait sits over the upper portion of the body
  const faceSize = size * 0.52;
  // How far from the top the face sits (head is top ~35% of body image)
  const faceTop = size * 0.01;

  return (
    <View style={[styles.root, { width: bodyWidth * 1.28, height: bodyHeight }]}>
      {/* ── Body / clothing layer ── */}
      <Animated.View
        style={[
          styles.bodyLayer,
          {
            width: bodyWidth,
            height: bodyHeight,
            bottom: 0,
            transform: [
              { scaleX: bodyScale.scaleX },
              { scaleY: bodyScale.scaleY },
            ],
            opacity: flashAnim,
          },
        ]}
      >
        <Image
          key={bodyKey}
          source={bodyImage}
          style={{ width: bodyWidth, height: bodyHeight }}
          contentFit="contain"
          transition={100}
        />
      </Animated.View>

      {/* ── Face / hair / skin portrait layer ── */}
      <Animated.View
        style={[
          styles.faceLayer,
          {
            width: faceSize,
            height: faceSize,
            top: faceTop,
            opacity: flashAnim,
            transform: [{ scale: springAnim }],
          },
        ]}
      >
        <Image
          key={`${base}_${config.hairstyle}_${config.skinTone}`}
          source={faceImage}
          style={{ width: faceSize, height: faceSize }}
          contentFit="contain"
          transition={90}
        />
      </Animated.View>

      {/* ── Clothing style accent bar (bottom indicator) ── */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: clothingAccent, width: bodyWidth * 0.45 },
        ]}
      />
    </View>
  );
}

// ─── COMPACT DISPLAY VARIANT ──────────────────────────────────────────────────
// Used in tabs, leaderboard, profile header, etc.

interface AvatarDisplayProps {
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

export function AvatarDisplay({ avatar, level, size = 'md', showLevel = true }: AvatarDisplayProps) {
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
          <View style={[dStyles.levelBadge, { minWidth: outerSize * 0.32, height: outerSize * 0.32, borderRadius: outerSize * 0.16 }]}>
            <Text style={[dStyles.levelText, { fontSize: levelFontSize }]}>{level}</Text>
          </View>
        )}
      </View>
    );
  }

  const base = genderToBase(avatar.genderPresentation);
  const bodyKey = `${base}_${avatar.clothingStyle}`;
  const bodyImg = BODY_IMAGES[bodyKey] ?? BODY_IMAGES[`${base}_casual`];
  const faceImg = getFaceImage(base, avatar.hairstyle, avatar.skinTone);
  const bodyScale = BODY_TYPE_SCALES[avatar.bodyType] ?? BODY_TYPE_SCALES.average;

  return (
    <View style={{ width: outerSize, height: outerSize, position: 'relative' }}>
      {/* Skin-tinted circle background */}
      <View
        style={[
          dStyles.circle,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: skinColor + '28',
            borderColor: skinColor + '55',
          },
        ]}
      >
        {/* Body inside circle */}
        <View
          style={{
            width: outerSize,
            height: outerSize,
            transform: [{ scaleX: bodyScale.scaleX }],
            overflow: 'hidden',
          }}
        >
          <Image
            source={bodyImg}
            style={{ width: outerSize, height: outerSize }}
            contentFit="contain"
            transition={80}
          />
        </View>
      </View>

      {/* Face overlay — top portion of circle */}
      <View
        style={[
          dStyles.faceOverlay,
          {
            width: outerSize * 0.72,
            height: outerSize * 0.72,
            top: 0,
            left: outerSize * 0.14,
          },
        ]}
      >
        <Image
          source={faceImg}
          style={{ width: outerSize * 0.72, height: outerSize * 0.72 }}
          contentFit="contain"
          transition={80}
        />
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
    position: 'relative',
  },
  bodyLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  faceLayer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  accentBar: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    borderRadius: 2,
    opacity: 0.55,
  },
});

const dStyles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  faceOverlay: {
    position: 'absolute',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.gold,
    borderRadius: Radius.round,
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
