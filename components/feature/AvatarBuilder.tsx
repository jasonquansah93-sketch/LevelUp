/**
 * AvatarBuilder — Live modular avatar preview component
 *
 * Architecture:
 * - Composite layer: full-body image (base × clothing) + face-head image (base × hairstyle)
 * - Skin tone: displayed as overlay ring tint + color swatch indicator
 * - Body type: CSS transform scaleX/scaleY on body image container
 * - Real-time: every prop change instantly updates all layers
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import {
  BODY_IMAGES, HAIR_IMAGES, SKIN_TONES, BODY_TYPE_SCALES,
  CLOTHING_ACCENTS, genderToBase,
} from '@/constants/avatarAssets';
import { AvatarConfig } from '@/contexts/GameContext';
import { Colors, Radius } from '@/constants/theme';

interface AvatarBuilderProps {
  config: AvatarConfig;
  size?: number;           // container height
  showSkinRing?: boolean;  // show skin-tone colored ring around avatar
  animate?: boolean;       // pulse animation on change
}

export function AvatarBuilder({
  config,
  size = 280,
  showSkinRing = true,
  animate = true,
}: AvatarBuilderProps) {
  const base = genderToBase(config.genderPresentation);
  const clothingKey = `${base}_${config.clothingStyle}`;
  const hairKey = `${base}_${config.hairstyle}`;

  const bodyImage = BODY_IMAGES[clothingKey] ?? BODY_IMAGES[`${base}_casual`];
  const hairImage = HAIR_IMAGES[hairKey] ?? HAIR_IMAGES[`${base}_short`];

  const bodyScale = BODY_TYPE_SCALES[config.bodyType] ?? BODY_TYPE_SCALES.average;
  const skinColor = SKIN_TONES[config.skinTone]?.color ?? SKIN_TONES.tone2.color;
  const clothingAccent = CLOTHING_ACCENTS[config.clothingStyle] ?? CLOTHING_ACCENTS.casual;

  // Animate on any config change
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const prevConfigRef = useRef<string>('');
  const configKey = `${base}_${config.skinTone}_${config.hairstyle}_${config.clothingStyle}_${config.bodyType}`;

  useEffect(() => {
    if (!animate || prevConfigRef.current === configKey) return;
    prevConfigRef.current = configKey;

    // Quick flash-in effect on change
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0.65, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      ]),
    ]).start();
  }, [configKey]);

  const bodyWidth = size * 0.72;
  const bodyHeight = size;
  const hairSize = size * 0.38;

  return (
    <View style={[styles.root, { width: bodyWidth * 1.3, height: bodyHeight }]}>
      {/* Skin tone ambient glow ring */}
      {showSkinRing && (
        <View
          style={[
            styles.skinRing,
            {
              width: bodyWidth * 1.2,
              height: bodyHeight * 0.88,
              borderRadius: bodyWidth * 0.6,
              borderColor: skinColor + '90',
              bottom: 0,
            },
          ]}
        />
      )}

      {/* Body / clothing layer — scales with body type */}
      <Animated.View
        style={[
          styles.bodyLayer,
          {
            width: bodyWidth,
            height: bodyHeight,
            transform: [
              { scaleX: bodyScale.scaleX },
              { scaleY: bodyScale.scaleY },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <Image
          key={clothingKey}
          source={bodyImage}
          style={{ width: bodyWidth, height: bodyHeight }}
          contentFit="contain"
          transition={120}
        />
      </Animated.View>

      {/* Face / hair layer — floats on top of body at the head position */}
      <Animated.View
        style={[
          styles.hairLayer,
          {
            width: hairSize,
            height: hairSize,
            top: size * 0.01,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          key={hairKey}
          source={hairImage}
          style={{ width: hairSize, height: hairSize }}
          contentFit="contain"
          transition={100}
        />
      </Animated.View>

      {/* Clothing accent bar — bottom indicator of active clothing style */}
      <View
        style={[
          styles.clothingBar,
          { backgroundColor: clothingAccent, width: bodyWidth * 0.5 },
        ]}
      />
    </View>
  );
}

// ─── MINI DISPLAY variant (for profile, leaderboard, etc.) ───────────────────

interface AvatarDisplayProps {
  avatar: AvatarConfig;
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
}

const DISPLAY_SIZES = {
  sm: { outer: 44 },
  md: { outer: 64 },
  lg: { outer: 96 },
  xl: { outer: 130 },
};

export function AvatarDisplay({ avatar, level, size = 'md', showLevel = true }: AvatarDisplayProps) {
  const dims = DISPLAY_SIZES[size];
  const outerSize = dims.outer;
  const base = genderToBase(avatar.genderPresentation);
  const bodyKey = `${base}_${avatar.clothingStyle}`;
  const hairKey = `${base}_${avatar.hairstyle}`;
  const bodyScale = BODY_TYPE_SCALES[avatar.bodyType] ?? BODY_TYPE_SCALES.average;
  const skinColor = SKIN_TONES[avatar.skinTone]?.color ?? SKIN_TONES.tone2.color;
  const levelFontSize = outerSize < 50 ? 9 : outerSize < 80 ? 10 : 12;

  if (avatar.photoUrl) {
    return (
      <View style={[dStyles.wrapper, { width: outerSize, height: outerSize }]}>
        <Image
          source={{ uri: avatar.photoUrl }}
          style={[dStyles.photoImg, { width: outerSize, height: outerSize, borderRadius: outerSize / 2, borderColor: Colors.gold + '80' }]}
          contentFit="cover"
          transition={200}
        />
        {showLevel && (
          <View style={dStyles.levelBadge}>
            <Text style={[dStyles.levelText, { fontSize: levelFontSize }]}>{level}</Text>
          </View>
        )}
      </View>
    );
  }

  const bodyImg = BODY_IMAGES[bodyKey] ?? BODY_IMAGES[`${base}_casual`];
  const hairImg = HAIR_IMAGES[hairKey] ?? HAIR_IMAGES[`${base}_short`];

  return (
    <View style={[dStyles.wrapper, { width: outerSize, height: outerSize }]}>
      {/* Skin-tinted circle background */}
      <View
        style={[
          dStyles.circle,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: skinColor + '25',
            borderColor: skinColor + '50',
          },
        ]}
      >
        {/* Body */}
        <View style={{ width: outerSize, height: outerSize, transform: [{ scaleX: bodyScale.scaleX }], overflow: 'hidden' }}>
          <Image
            source={bodyImg}
            style={{ width: outerSize, height: outerSize }}
            contentFit="contain"
            transition={100}
          />
        </View>
      </View>
      {/* Hair face overlay */}
      <View
        style={[
          dStyles.hairOverlay,
          { width: outerSize * 0.7, height: outerSize * 0.7, top: 0, left: outerSize * 0.15 },
        ]}
      >
        <Image
          source={hairImg}
          style={{ width: outerSize * 0.7, height: outerSize * 0.7 }}
          contentFit="contain"
          transition={80}
        />
      </View>
      {showLevel && (
        <View style={dStyles.levelBadge}>
          <Text style={[dStyles.levelText, { fontSize: levelFontSize }]}>{level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  skinRing: {
    position: 'absolute',
    borderWidth: 2.5,
    bottom: 0,
  },
  bodyLayer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hairLayer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  clothingBar: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
});

const dStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  circle: {
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hairOverlay: {
    position: 'absolute',
  },
  photoImg: {
    borderWidth: 2,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.gold,
    borderRadius: Radius.round,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelText: {
    color: Colors.textInverse ?? '#fff',
    fontWeight: '700',
    lineHeight: 14,
  },
});
