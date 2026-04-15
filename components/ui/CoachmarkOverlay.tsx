/**
 * CoachmarkOverlay — lightweight first-time-only guided overlay
 *
 * Renders a dimmed Modal with:
 *  - a bordered highlight box indicating which area to look at
 *  - a compact rounded instruction card with step content
 *  - Skip / Back / Next controls
 *
 * Highlight approach: transparent box with a gold border + faint glow ring
 * (no fragile cutout masking — reliable across all screen sizes).
 *
 * Persistence: AsyncStorage keyed per screen so each overlay fires only once.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadows } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Defines the approximate position of the highlight ring on screen.
 *  Values are fractions of screen dimensions (0–1) for portability. */
export interface HighlightRegion {
  /** Distance from top of screen, as fraction of screenHeight (0–1) */
  topFraction: number;
  /** Height of the highlight box in pixels */
  height: number;
  /** Horizontal inset on each side in pixels (default 16) */
  horizontalInset?: number;
}

export interface CoachmarkStep {
  title: string;
  body: string;
  highlight: HighlightRegion;
  /** Where to place the card — 'above' or 'below' the highlight (default 'below') */
  cardPosition?: 'above' | 'below';
}

interface CoachmarkOverlayProps {
  /** Unique AsyncStorage key — e.g. 'coachmark_categories' */
  storageKey: string;
  steps: CoachmarkStep[];
  /** Called when overlay finishes or is skipped */
  onDone?: () => void;
}

// ─── Persistence helpers ─────────────────────────────────────────────────────

const STORAGE_PREFIX = '@levelup_coachmark_';

async function hasSeenCoachmark(key: string): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_PREFIX + key);
    return val === 'done';
  } catch {
    return false; // On error, show overlay (fail-open for first-time UX)
  }
}

async function markCoachmarkSeen(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, 'done');
  } catch {
    // Non-fatal — overlay may show again next time, acceptable
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CoachmarkOverlay({ storageKey, steps, onDone }: CoachmarkOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Check persistence on mount — only show if never seen
  useEffect(() => {
    let cancelled = false;
    hasSeenCoachmark(storageKey).then((seen) => {
      if (!cancelled) {
        setVisible(!seen);
        setReady(true);
      }
    });
    return () => { cancelled = true; };
  }, [storageKey]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    await markCoachmarkSeen(storageKey);
    onDone?.();
  }, [storageKey, onDone]);

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      dismiss();
    }
  }, [stepIndex, steps.length, dismiss]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!ready || !visible || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  // ── Highlight box geometry ─────────────────────────────────────────────────
  const inset = step.highlight.horizontalInset ?? 16;
  const hlTop = step.highlight.topFraction * screenHeight;
  const hlHeight = step.highlight.height;
  const hlWidth = screenWidth - inset * 2;

  // ── Card position: prefer 'below' unless there isn't enough space ──────────
  const cardPosition = step.cardPosition ?? 'below';
  const CARD_APPROX_HEIGHT = 210; // conservative estimate
  const GAP = 16;
  const spaceBelow = screenHeight - (hlTop + hlHeight) - GAP;
  const spaceAbove = hlTop - GAP;

  let cardTop: number;
  if (cardPosition === 'above' || spaceBelow < CARD_APPROX_HEIGHT + 32) {
    // Place above — if truly no space above either, fall back to below anyway
    cardTop = spaceAbove < CARD_APPROX_HEIGHT
      ? hlTop + hlHeight + GAP
      : hlTop - CARD_APPROX_HEIGHT - GAP;
  } else {
    cardTop = hlTop + hlHeight + GAP;
  }

  // Clamp card within screen vertically with some padding
  cardTop = Math.max(48, Math.min(cardTop, screenHeight - CARD_APPROX_HEIGHT - 48));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* ── Full-screen dimmed backdrop ────────────────────────────────── */}
      <View style={styles.backdrop} pointerEvents="box-none">

        {/* ── Highlight ring ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.highlightRing,
            {
              top: hlTop,
              left: inset,
              width: hlWidth,
              height: hlHeight,
            },
          ]}
          pointerEvents="none"
        />

        {/* ── Instruction card ───────────────────────────────────────────── */}
        <View
          style={[
            styles.card,
            {
              top: cardTop,
              left: Spacing.xl,
              right: Spacing.xl,
            },
          ]}
        >
          {/* Step pills */}
          <View style={styles.pillRow}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[styles.pill, i === stepIndex && styles.pillActive]}
              />
            ))}
          </View>

          {/* Content */}
          <Text style={styles.cardTitle}>{step.title}</Text>
          <Text style={styles.cardBody}>{step.body}</Text>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Skip — always visible */}
            <Pressable
              onPress={dismiss}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <View style={styles.navButtons}>
              {/* Back — hidden on first step */}
              {!isFirst && (
                <Pressable
                  onPress={back}
                  style={({ pressed }) => [styles.navBtn, styles.navBtnSecondary, pressed && styles.pressed]}
                  hitSlop={8}
                >
                  <MaterialIcons name="arrow-back" size={16} color={Colors.textSecondary} />
                  <Text style={styles.navBtnSecondaryText}>Back</Text>
                </Pressable>
              )}

              {/* Next / Done */}
              <Pressable
                onPress={next}
                style={({ pressed }) => [styles.navBtn, styles.navBtnPrimary, pressed && styles.pressed]}
                hitSlop={8}
              >
                <Text style={styles.navBtnPrimaryText}>
                  {isLast ? 'Got it' : 'Next'}
                </Text>
                {!isLast && <MaterialIcons name="arrow-forward" size={16} color={Colors.textInverse} />}
                {isLast && <MaterialIcons name="check" size={16} color={Colors.textInverse} />}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 18, 6, 0.62)',
  },

  // Transparent box with a gold border to spotlight the target area
  highlightRing: {
    position: 'absolute',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: 'transparent',
    // Subtle glow effect
    ...Platform.select({
      ios: {
        shadowColor: Colors.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
      },
      android: { elevation: 0 }, // Android elevation doesn't work for outline glow
    }),
  },

  card: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.md,
  },

  pillRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 2,
  },
  pill: {
    height: 4,
    width: 20,
    borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
  },
  pillActive: {
    backgroundColor: Colors.gold,
    width: 28,
  },

  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  cardBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  navButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.round,
  },
  navBtnPrimary: {
    backgroundColor: Colors.gold,
  },
  navBtnSecondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  navBtnPrimaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  navBtnSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
});
