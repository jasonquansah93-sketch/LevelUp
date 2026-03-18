/**
 * Avatar Asset System — v2
 *
 * Architecture:
 * - FACE_IMAGES: 60 pre-rendered bust portraits keyed `face_{base}_{hair}_{tone}`
 *   Each image encodes BOTH skin tone and hairstyle, so every selection changes
 *   the visible character immediately. No tinting hacks needed.
 * - BODY_IMAGES: 8 clothing-style full-body images keyed `{base}_{clothing}`
 *   Body type is handled via scaleX/scaleY transforms at render time.
 *
 * Combinations: 2 bases × 6 skin tones × 5 hairstyles × 4 clothing × 4 body = 960
 */

// ─── BASE CHARACTER MAPPING ───────────────────────────────────────────────────

export type BaseChar = 'm' | 'f';

/** Neutral maps to masculine — only 2 character families ever exist */
export function genderToBase(genderPresentation: string): BaseChar {
  return genderPresentation === 'feminine' ? 'f' : 'm';
}

// ─── FACE PORTRAIT IMAGES (skin tone + hairstyle combined) ───────────────────
// Key: `face_${base}_${hairstyle}_${toneId}`

export const FACE_IMAGES: Record<string, any> = {
  // ── Masculine · Short ──────────────────────────────────────────────────────
  face_m_short_tone1: require('@/assets/avatars/face_m_short_tone1.png'),
  face_m_short_tone2: require('@/assets/avatars/face_m_short_tone2.png'),
  face_m_short_tone3: require('@/assets/avatars/face_m_short_tone3.png'),
  face_m_short_tone4: require('@/assets/avatars/face_m_short_tone4.png'),
  face_m_short_tone5: require('@/assets/avatars/face_m_short_tone5.png'),
  face_m_short_tone6: require('@/assets/avatars/face_m_short_tone6.png'),
  // ── Masculine · Medium ─────────────────────────────────────────────────────
  face_m_medium_tone1: require('@/assets/avatars/face_m_medium_tone1.png'),
  face_m_medium_tone2: require('@/assets/avatars/face_m_medium_tone2.png'),
  face_m_medium_tone3: require('@/assets/avatars/face_m_medium_tone3.png'),
  face_m_medium_tone4: require('@/assets/avatars/face_m_medium_tone4.png'),
  face_m_medium_tone5: require('@/assets/avatars/face_m_medium_tone5.png'),
  face_m_medium_tone6: require('@/assets/avatars/face_m_medium_tone6.png'),
  // ── Masculine · Long ───────────────────────────────────────────────────────
  face_m_long_tone1: require('@/assets/avatars/face_m_long_tone1.png'),
  face_m_long_tone2: require('@/assets/avatars/face_m_long_tone2.png'),
  face_m_long_tone3: require('@/assets/avatars/face_m_long_tone3.png'),
  face_m_long_tone4: require('@/assets/avatars/face_m_long_tone4.png'),
  face_m_long_tone5: require('@/assets/avatars/face_m_long_tone5.png'),
  face_m_long_tone6: require('@/assets/avatars/face_m_long_tone6.png'),
  // ── Masculine · Buzz Cut ───────────────────────────────────────────────────
  face_m_buzz_tone1: require('@/assets/avatars/face_m_buzz_tone1.png'),
  face_m_buzz_tone2: require('@/assets/avatars/face_m_buzz_tone2.png'),
  face_m_buzz_tone3: require('@/assets/avatars/face_m_buzz_tone3.png'),
  face_m_buzz_tone4: require('@/assets/avatars/face_m_buzz_tone4.png'),
  face_m_buzz_tone5: require('@/assets/avatars/face_m_buzz_tone5.png'),
  face_m_buzz_tone6: require('@/assets/avatars/face_m_buzz_tone6.png'),
  // ── Masculine · Bald ──────────────────────────────────────────────────────
  face_m_bald_tone1: require('@/assets/avatars/face_m_bald_tone1.png'),
  face_m_bald_tone2: require('@/assets/avatars/face_m_bald_tone2.png'),
  face_m_bald_tone3: require('@/assets/avatars/face_m_bald_tone3.png'),
  face_m_bald_tone4: require('@/assets/avatars/face_m_bald_tone4.png'),
  face_m_bald_tone5: require('@/assets/avatars/face_m_bald_tone5.png'),
  face_m_bald_tone6: require('@/assets/avatars/face_m_bald_tone6.png'),

  // ── Feminine · Short ───────────────────────────────────────────────────────
  face_f_short_tone1: require('@/assets/avatars/face_f_short_tone1.png'),
  face_f_short_tone2: require('@/assets/avatars/face_f_short_tone2.png'),
  face_f_short_tone3: require('@/assets/avatars/face_f_short_tone3.png'),
  face_f_short_tone4: require('@/assets/avatars/face_f_short_tone4.png'),
  face_f_short_tone5: require('@/assets/avatars/face_f_short_tone5.png'),
  face_f_short_tone6: require('@/assets/avatars/face_f_short_tone6.png'),
  // ── Feminine · Medium ──────────────────────────────────────────────────────
  face_f_medium_tone1: require('@/assets/avatars/face_f_medium_tone1.png'),
  face_f_medium_tone2: require('@/assets/avatars/face_f_medium_tone2.png'),
  face_f_medium_tone3: require('@/assets/avatars/face_f_medium_tone3.png'),
  face_f_medium_tone4: require('@/assets/avatars/face_f_medium_tone4.png'),
  face_f_medium_tone5: require('@/assets/avatars/face_f_medium_tone5.png'),
  face_f_medium_tone6: require('@/assets/avatars/face_f_medium_tone6.png'),
  // ── Feminine · Long ────────────────────────────────────────────────────────
  face_f_long_tone1: require('@/assets/avatars/face_f_long_tone1.png'),
  face_f_long_tone2: require('@/assets/avatars/face_f_long_tone2.png'),
  face_f_long_tone3: require('@/assets/avatars/face_f_long_tone3.png'),
  face_f_long_tone4: require('@/assets/avatars/face_f_long_tone4.png'),
  face_f_long_tone5: require('@/assets/avatars/face_f_long_tone5.png'),
  face_f_long_tone6: require('@/assets/avatars/face_f_long_tone6.png'),
  // ── Feminine · Buzz Cut ────────────────────────────────────────────────────
  face_f_buzz_tone1: require('@/assets/avatars/face_f_buzz_tone1.png'),
  face_f_buzz_tone2: require('@/assets/avatars/face_f_buzz_tone2.png'),
  face_f_buzz_tone3: require('@/assets/avatars/face_f_buzz_tone3.png'),
  face_f_buzz_tone4: require('@/assets/avatars/face_f_buzz_tone4.png'),
  face_f_buzz_tone5: require('@/assets/avatars/face_f_buzz_tone5.png'),
  face_f_buzz_tone6: require('@/assets/avatars/face_f_buzz_tone6.png'),
  // ── Feminine · Bald ────────────────────────────────────────────────────────
  face_f_bald_tone1: require('@/assets/avatars/face_f_bald_tone1.png'),
  face_f_bald_tone2: require('@/assets/avatars/face_f_bald_tone2.png'),
  face_f_bald_tone3: require('@/assets/avatars/face_f_bald_tone3.png'),
  face_f_bald_tone4: require('@/assets/avatars/face_f_bald_tone4.png'),
  face_f_bald_tone5: require('@/assets/avatars/face_f_bald_tone5.png'),
  face_f_bald_tone6: require('@/assets/avatars/face_f_bald_tone6.png'),
};

/** Resolve a face image from (base, hairstyle, skinTone). Falls back gracefully. */
export function getFaceImage(base: BaseChar, hairstyle: string, skinTone: string): any {
  const key = `face_${base}_${hairstyle}_${skinTone}`;
  return FACE_IMAGES[key] ?? FACE_IMAGES[`face_${base}_short_tone2`];
}

// ─── BODY / CLOTHING IMAGES ───────────────────────────────────────────────────
// Keyed by `${base}_${clothing}`

export const BODY_IMAGES: Record<string, any> = {
  m_casual:     require('@/assets/avatars/base_m_casual.png'),
  m_athletic:   require('@/assets/avatars/base_m_athletic.png'),
  m_business:   require('@/assets/avatars/base_m_business.png'),
  m_streetwear: require('@/assets/avatars/base_m_streetwear.png'),
  f_casual:     require('@/assets/avatars/base_f_casual.png'),
  f_athletic:   require('@/assets/avatars/base_f_athletic.png'),
  f_business:   require('@/assets/avatars/base_f_business.png'),
  f_streetwear: require('@/assets/avatars/base_f_streetwear.png'),
};

// ─── SKIN TONE METADATA ───────────────────────────────────────────────────────

export const SKIN_TONES: Record<string, { color: string; label: string }> = {
  tone1: { color: '#FDDBB4', label: 'Very Light' },
  tone2: { color: '#F0C27F', label: 'Light' },
  tone3: { color: '#D4956A', label: 'Medium Light' },
  tone4: { color: '#A0612A', label: 'Medium' },
  tone5: { color: '#6B3A1F', label: 'Dark' },
  tone6: { color: '#2E1508', label: 'Very Dark' },
};

export const SKIN_TONE_ORDER = ['tone1', 'tone2', 'tone3', 'tone4', 'tone5', 'tone6'] as const;

// ─── BODY TYPE SCALE FACTORS ──────────────────────────────────────────────────

export const BODY_TYPE_SCALES: Record<string, { scaleX: number; scaleY: number }> = {
  lean:     { scaleX: 0.86, scaleY: 1.03 },
  average:  { scaleX: 1.00, scaleY: 1.00 },
  athletic: { scaleX: 1.08, scaleY: 1.00 },
  broad:    { scaleX: 1.16, scaleY: 0.98 },
};

// ─── CLOTHING ACCENT COLORS ───────────────────────────────────────────────────

export const CLOTHING_ACCENTS: Record<string, string> = {
  casual:     '#E8763A',
  athletic:   '#2A2A2A',
  business:   '#3D4F7A',
  streetwear: '#4A4A4A',
};
