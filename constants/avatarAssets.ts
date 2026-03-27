/**
 * Avatar Asset System — v3
 *
 * Architecture: Single-image approach.
 * Each avatar state maps to ONE pre-rendered full-body transparent PNG that
 * encodes hairstyle + skin tone together in a coherent, aligned illustration.
 * Clothing overlay and body-type scale transforms are applied on top via CSS.
 *
 * ASSET KEY: `body_${base}_${hairstyle}_${toneId}`
 *   base: 'm' | 'f'  (masculine / feminine — NO neutral)
 *   hairstyle: 'short' | 'medium' | 'long' | 'buzz' | 'bald'
 *   toneId: 'tone1' … 'tone6'
 *
 * Total primary images: 2 × 5 × 6 = 60 (all transparent PNG, 2:3 aspect)
 *
 * All assets share:
 *   - Same canvas ratio (2:3)
 *   - Same foot baseline (character bottom ~5% from image bottom)
 *   - Same head anchor  (character top ~5% from image top)
 *   - Transparent background — no white boxes
 */

// ─── BASE CHARACTER MAPPING ───────────────────────────────────────────────────

export type BaseChar = 'm' | 'f';

/**
 * Only 2 base characters exist: masculine ('m') and feminine ('f').
 * Neutral is not supported — it maps to masculine as a safe fallback.
 */
export function genderToBase(genderPresentation: string): BaseChar {
  return genderPresentation === 'feminine' ? 'f' : 'm';
}

// ─── FULL-BODY AVATAR IMAGES ──────────────────────────────────────────────────
// Key: `body_${base}_${hairstyle}_${toneId}`
// Each PNG is a complete integrated character: skin + hair + default clothing.
// Body-type scale and clothing-accent colour are applied in the renderer.

export const AVATAR_IMAGES: Record<string, any> = {
  // ══ MASCULINE · SHORT ═══════════════════════════════════════════════════════
  body_m_short_tone1: require('@/assets/avatars/body_m_short_tone1.png'),
  body_m_short_tone2: require('@/assets/avatars/body_m_short_tone2.png'),
  body_m_short_tone3: require('@/assets/avatars/body_m_short_tone3.png'),
  body_m_short_tone4: require('@/assets/avatars/body_m_short_tone4.png'),
  body_m_short_tone5: require('@/assets/avatars/body_m_short_tone5.png'),
  body_m_short_tone6: require('@/assets/avatars/body_m_short_tone6.png'),
  // ══ MASCULINE · MEDIUM ══════════════════════════════════════════════════════
  body_m_medium_tone1: require('@/assets/avatars/body_m_medium_tone1.png'),
  body_m_medium_tone2: require('@/assets/avatars/body_m_medium_tone2.png'),
  body_m_medium_tone3: require('@/assets/avatars/body_m_medium_tone3.png'),
  body_m_medium_tone4: require('@/assets/avatars/body_m_medium_tone4.png'),
  body_m_medium_tone5: require('@/assets/avatars/body_m_medium_tone5.png'),
  body_m_medium_tone6: require('@/assets/avatars/body_m_medium_tone6.png'),
  // ══ MASCULINE · LONG ════════════════════════════════════════════════════════
  body_m_long_tone1: require('@/assets/avatars/body_m_long_tone1.png'),
  body_m_long_tone2: require('@/assets/avatars/body_m_long_tone2.png'),
  body_m_long_tone3: require('@/assets/avatars/body_m_long_tone3.png'),
  body_m_long_tone4: require('@/assets/avatars/body_m_long_tone4.png'),
  body_m_long_tone5: require('@/assets/avatars/body_m_long_tone5.png'),
  body_m_long_tone6: require('@/assets/avatars/body_m_long_tone6.png'),
  // ══ MASCULINE · BUZZ ════════════════════════════════════════════════════════
  body_m_buzz_tone1: require('@/assets/avatars/body_m_buzz_tone1.png'),
  body_m_buzz_tone2: require('@/assets/avatars/body_m_buzz_tone2.png'),
  body_m_buzz_tone3: require('@/assets/avatars/body_m_buzz_tone3.png'),
  body_m_buzz_tone4: require('@/assets/avatars/body_m_buzz_tone4.png'),
  body_m_buzz_tone5: require('@/assets/avatars/body_m_buzz_tone5.png'),
  body_m_buzz_tone6: require('@/assets/avatars/body_m_buzz_tone6.png'),
  // ══ MASCULINE · BALD ════════════════════════════════════════════════════════
  body_m_bald_tone1: require('@/assets/avatars/body_m_bald_tone1.png'),
  body_m_bald_tone2: require('@/assets/avatars/body_m_bald_tone2.png'),
  body_m_bald_tone3: require('@/assets/avatars/body_m_bald_tone3.png'),
  body_m_bald_tone4: require('@/assets/avatars/body_m_bald_tone4.png'),
  body_m_bald_tone5: require('@/assets/avatars/body_m_bald_tone5.png'),
  body_m_bald_tone6: require('@/assets/avatars/body_m_bald_tone6.png'),

  // ══ FEMININE · SHORT ════════════════════════════════════════════════════════
  body_f_short_tone1: require('@/assets/avatars/body_f_short_tone1.png'),
  body_f_short_tone2: require('@/assets/avatars/body_f_short_tone2.png'),
  body_f_short_tone3: require('@/assets/avatars/body_f_short_tone3.png'),
  body_f_short_tone4: require('@/assets/avatars/body_f_short_tone4.png'),
  body_f_short_tone5: require('@/assets/avatars/body_f_short_tone5.png'),
  body_f_short_tone6: require('@/assets/avatars/body_f_short_tone6.png'),
  // ══ FEMININE · MEDIUM ═══════════════════════════════════════════════════════
  body_f_medium_tone1: require('@/assets/avatars/body_f_medium_tone1.png'),
  body_f_medium_tone2: require('@/assets/avatars/body_f_medium_tone2.png'),
  body_f_medium_tone3: require('@/assets/avatars/body_f_medium_tone3.png'),
  body_f_medium_tone4: require('@/assets/avatars/body_f_medium_tone4.png'),
  body_f_medium_tone5: require('@/assets/avatars/body_f_medium_tone5.png'),
  body_f_medium_tone6: require('@/assets/avatars/body_f_medium_tone6.png'),
  // ══ FEMININE · LONG ═════════════════════════════════════════════════════════
  body_f_long_tone1: require('@/assets/avatars/body_f_long_tone1.png'),
  body_f_long_tone2: require('@/assets/avatars/body_f_long_tone2.png'),
  body_f_long_tone3: require('@/assets/avatars/body_f_long_tone3.png'),
  body_f_long_tone4: require('@/assets/avatars/body_f_long_tone4.png'),
  body_f_long_tone5: require('@/assets/avatars/body_f_long_tone5.png'),
  body_f_long_tone6: require('@/assets/avatars/body_f_long_tone6.png'),
  // ══ FEMININE · BUZZ ═════════════════════════════════════════════════════════
  body_f_buzz_tone1: require('@/assets/avatars/body_f_buzz_tone1.png'),
  body_f_buzz_tone2: require('@/assets/avatars/body_f_buzz_tone2.png'),
  body_f_buzz_tone3: require('@/assets/avatars/body_f_buzz_tone3.png'),
  body_f_buzz_tone4: require('@/assets/avatars/body_f_buzz_tone4.png'),
  body_f_buzz_tone5: require('@/assets/avatars/body_f_buzz_tone5.png'),
  body_f_buzz_tone6: require('@/assets/avatars/body_f_buzz_tone6.png'),
  // ══ FEMININE · BALD ═════════════════════════════════════════════════════════
  body_f_bald_tone1: require('@/assets/avatars/body_f_bald_tone1.png'),
  body_f_bald_tone2: require('@/assets/avatars/body_f_bald_tone2.png'),
  body_f_bald_tone3: require('@/assets/avatars/body_f_bald_tone3.png'),
  body_f_bald_tone4: require('@/assets/avatars/body_f_bald_tone4.png'),
  body_f_bald_tone5: require('@/assets/avatars/body_f_bald_tone5.png'),
  body_f_bald_tone6: require('@/assets/avatars/body_f_bald_tone6.png'),
};

/**
 * Resolve the correct full-body avatar image.
 * Falls back gracefully to a known-good asset if the key is missing.
 */
export function getAvatarImage(
  base: BaseChar,
  hairstyle: string,
  skinTone: string
): any {
  const key = `body_${base}_${hairstyle}_${skinTone}`;
  return (
    AVATAR_IMAGES[key] ??
    AVATAR_IMAGES[`body_${base}_short_tone2`] ??
    AVATAR_IMAGES['body_m_short_tone2']
  );
}

// ─── SKIN TONE METADATA ───────────────────────────────────────────────────────

export const SKIN_TONES: Record<string, { color: string; label: string }> = {
  tone1: { color: '#FDDBB4', label: 'Very Light' },
  tone2: { color: '#F0C27F', label: 'Light' },
  tone3: { color: '#D4956A', label: 'Medium Light' },
  tone4: { color: '#A0612A', label: 'Medium' },
  tone5: { color: '#6B3A1F', label: 'Dark' },
  tone6: { color: '#2E1508', label: 'Very Dark' },
};

export const SKIN_TONE_ORDER = [
  'tone1', 'tone2', 'tone3', 'tone4', 'tone5', 'tone6',
] as const;

// ─── BODY TYPE IMAGES ────────────────────────────────────────────────────────
// 8 dedicated full-body transparent PNGs — one per base × body-type.
// Only the silhouette/build changes; face, hair, outfit, pose, canvas are fixed.
// Key: `${base}_body_${bodyType}`  e.g. 'masculine_body_lean'

export const BODY_TYPE_IMAGES: Record<string, any> = {
  // ── Masculine ────────────────────────────────────────────────────────────────
  masculine_body_lean:     require('@/assets/avatars/masculine_body_lean.png'),
  masculine_body_average:  require('@/assets/avatars/masculine_body_average.png'),
  masculine_body_athletic: require('@/assets/avatars/masculine_body_athletic.png'),
  masculine_body_broad:    require('@/assets/avatars/masculine_body_broad.png'),
  // ── Feminine ─────────────────────────────────────────────────────────────────
  feminine_body_lean:     require('@/assets/avatars/feminine_body_lean.png'),
  feminine_body_average:  require('@/assets/avatars/feminine_body_average.png'),
  feminine_body_athletic: require('@/assets/avatars/feminine_body_athletic.png'),
  feminine_body_broad:    require('@/assets/avatars/feminine_body_broad.png'),
};

/**
 * Resolve the body-type image for a given gender presentation and body type.
 * Falls back to 'average' if the key is not found.
 */
export function getBodyTypeImage(genderPresentation: string, bodyType: string): any {
  const base = genderPresentation === 'feminine' ? 'feminine' : 'masculine';
  const key = `${base}_body_${bodyType}`;
  return BODY_TYPE_IMAGES[key] ?? BODY_TYPE_IMAGES[`${base}_body_average`];
}

// ─── BODY TYPE SCALE FACTORS ──────────────────────────────────────────────────
// Kept as minor fine-tune transforms applied on top of body-type images.
// These are small adjustments only — the primary silhouette is driven by the image.

export const BODY_TYPE_SCALES: Record<string, { scaleX: number; scaleY: number }> = {
  lean:     { scaleX: 0.97, scaleY: 1.00 },
  average:  { scaleX: 1.00, scaleY: 1.00 },
  athletic: { scaleX: 1.00, scaleY: 1.00 },
  broad:    { scaleX: 1.00, scaleY: 1.00 },
};

// ─── CLOTHING ACCENT COLORS ───────────────────────────────────────────────────

export const CLOTHING_ACCENTS: Record<string, string> = {
  casual:     '#E8763A',
  athletic:   '#2A2A2A',
  business:   '#3D4F7A',
  streetwear: '#4A4A4A',
};

// ─── LEGACY RE-EXPORTS (for backward compat with AvatarDisplay) ───────────────
// These are kept so existing profile/leaderboard code doesn't break.

/** @deprecated Use getAvatarImage() instead */
export const FACE_IMAGES: Record<string, any> = AVATAR_IMAGES;
/** @deprecated Use getAvatarImage() instead */
export function getFaceImage(base: BaseChar, hairstyle: string, skinTone: string): any {
  return getAvatarImage(base, hairstyle, skinTone);
}
/** @deprecated Use AVATAR_IMAGES instead */
export const BODY_IMAGES: Record<string, any> = AVATAR_IMAGES;
