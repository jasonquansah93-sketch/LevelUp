import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { AvatarConfig } from '@/contexts/GameContext';
import { Colors, Radius, FontSize, FontWeight } from '@/constants/theme';

interface AvatarDisplayProps {
  avatar: AvatarConfig;
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
}

const SKIN_COLORS: Record<string, string> = {
  tone1: '#FDDBB4',
  tone2: '#F0C27F',
  tone3: '#C68642',
  tone4: '#8D5524',
  tone5: '#5C3317',
  tone6: '#3B1F0B',
};

const CLOTHING_COLORS: Record<string, string> = {
  casual: '#3A3A5C',
  athletic: '#1A3A5C',
  business: '#2A2A4A',
  streetwear: '#2A3A2A',
};

const SIZES = {
  sm: { outer: 44, inner: 36, icon: 20, level: 10 },
  md: { outer: 64, inner: 52, icon: 28, level: 11 },
  lg: { outer: 96, inner: 80, icon: 42, level: 12 },
  xl: { outer: 130, inner: 112, icon: 58, level: 13 },
};

export function AvatarDisplay({ avatar, level, size = 'md', showLevel = true }: AvatarDisplayProps) {
  const dims = SIZES[size];
  const skinColor = SKIN_COLORS[avatar.skinTone] || SKIN_COLORS.tone2;
  const clothingColor = CLOTHING_COLORS[avatar.clothingStyle] || CLOTHING_COLORS.casual;
  const hasPhoto = !!avatar.photoUrl;

  return (
    <View style={[styles.wrapper, { width: dims.outer, height: dims.outer }]}>
      {hasPhoto ? (
        <Image
          source={{ uri: avatar.photoUrl }}
          style={[
            styles.avatar,
            {
              width: dims.outer,
              height: dims.outer,
              borderRadius: dims.outer / 2,
              borderColor: Colors.gold + '80',
            },
          ]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            {
              width: dims.outer,
              height: dims.outer,
              borderRadius: dims.outer / 2,
              backgroundColor: clothingColor,
              borderColor: Colors.gold + '60',
            },
          ]}
        >
          <MaterialIcons name="person" size={dims.icon} color={skinColor} />
        </View>
      )}
      {showLevel && (
        <View style={[styles.levelBadge, { bottom: -2, right: -2 }]}>
          <Text style={[styles.levelText, { fontSize: dims.level }]}>{level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  levelBadge: {
    position: 'absolute',
    backgroundColor: Colors.gold,
    borderRadius: Radius.round,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    lineHeight: 14,
  },
});
