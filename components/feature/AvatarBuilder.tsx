/**
 * AvatarBuilder — v3 (single integrated image)
 *
 * Render architecture — single image:
 *
 *   ┌─────────────────────────────────────────┐
 *   │  Container: transparent, 2:3 aspect     │
 *   │                                         │
 *   │  ONE integrated avatar image            │
 *   │    • body_{base}_{hair}_{tone}.png      │
 *   │    • transparent PNG, same canvas       │
 *   │    • body-type scale applied via CSS    │
 *   └─────────────────────────────────────────┘
 *
 * Selectors that drive the preview:
 *   • Gender      → base character
 *   • Skin tone   → integrated image
 *   • Hairstyle   → integrated image
 *   • Body type   → scaleX transform
 *   • Clothing    → accent color indicator only (future: separate layer)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native';
import {
  SKIN_TONES,
  BODY_TYPE_SCALES,
  CLOTHING_ACCENTS,
  genderToBase,
  getAvatarImage,
} from '@/constants/avatarAssets';
import { AvatarConfig } from '@/contexts/GameContext';
import { Colors, Radius } from '@/constants/theme';

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

  // Single integrated image encoding hairstyle + skin tone
  const avatarImage = getAvatarImage(base, config.hairstyle, config.skinTone);

  // Body type: minor scale adjustment
  const bodyScale = BODY_TYPE_SCALES[config.bodyType] ?? BODY_TYPE_SCALES.average;
  const clothingAccent = CLOTHING_ACCENTS[config.clothingStyle] ?? CLOTHING_ACCENTS.casual;

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
  const containerWidth = size * (2 / 3);

  return (
    <View style={[styles.root, { width: containerWidth + 40, height: containerHeight }]}>
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
        {/* Single integrated avatar image */}
        <Animated.View
          style={{
            width: containerWidth,
            height: containerHeight,
            transform: [{ scaleX: bodyScale.scaleX }],
          }}
        >
          <Image
            key={`avatar_${base}_${config.hairstyle}_${config.skinTone}_${config.bodyType}`}
            source={avatarImage}
            style={{ width: containerWidth, height: containerHeight }}
            contentFit="contain"
            transition={140}
          />
        </Animated.View>
      </Animated.View>

      {/* Clothing accent indicator (decorative) */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: clothingAccent, width: containerWidth * 0.4 },
        ]}
      />
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
  accentBar: {
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
    marginTop: 6,
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
