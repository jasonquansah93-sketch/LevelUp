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

// ─── CLOTHING STYLE IMAGES ──────────────────────────────────────────────────
// 8 dedicated full-body transparent PNGs — one per base × clothing style.
// Only the outfit changes; face, hair, body shape, pose, canvas are identical.
// Key: `${base}_clothing_${style}`  e.g. 'masculine_clothing_casual'

export const CLOTHING_IMAGES: Record<string, any> = {
  // ── Masculine ──────────────────────────────────────────────────────────────
  masculine_clothing_casual:     require('@/assets/avatars/masculine_clothing_casual.png'),
  masculine_clothing_athletic:   require('@/assets/avatars/masculine_clothing_athletic.png'),
  masculine_clothing_business:   require('@/assets/avatars/masculine_clothing_business.png'),
  masculine_clothing_streetwear: require('@/assets/avatars/masculine_clothing_streetwear.png'),
  // ── Feminine ───────────────────────────────────────────────────────────────
  feminine_clothing_casual:      require('@/assets/avatars/feminine_clothing_casual.png'),
  feminine_clothing_athletic:    require('@/assets/avatars/feminine_clothing_athletic.png'),
  feminine_clothing_business:    require('@/assets/avatars/feminine_clothing_business.png'),
  feminine_clothing_streetwear:  require('@/assets/avatars/feminine_clothing_streetwear.png'),
};

/**
 * Resolve the clothing-style image for a given gender presentation and style.
 * Falls back to 'casual' if the key is not found.
 */
export function getClothingImage(genderPresentation: string, clothingStyle: string): any {
  const base = genderPresentation === 'feminine' ? 'feminine' : 'masculine';
  const key = `${base}_clothing_${clothingStyle}`;
  return CLOTHING_IMAGES[key] ?? CLOTHING_IMAGES[`${base}_clothing_casual`];
}

// ─── BODY TYPE SCALE FACTORS ──────────────────────────────────────────────────
// Applied as CSS scaleX + scaleY transforms on the PRIMARY identity image.
// These values are deliberately distinct so each body type is visually readable.
//
// RULE: These are the ONLY place body type affects the preview.
//       Body type must NEVER swap or replace the primary avatar image source.
//
//   lean     → noticeably narrower silhouette
//   average  → neutral baseline (1.0 × 1.0)
//   athletic → slightly wider + taller
//   broad    → clearly wider, slightly compressed vertically

export const BODY_TYPE_SCALES: Record<string, { scaleX: number; scaleY: number }> = {
  lean:     { scaleX: 0.85, scaleY: 1.02 },
  average:  { scaleX: 1.00, scaleY: 1.00 },
  athletic: { scaleX: 1.07, scaleY: 1.01 },
  broad:    { scaleX: 1.16, scaleY: 0.98 },
};

// ─── CLOTHING ACCENT COLORS ───────────────────────────────────────────────────
// Used by the clothing chip indicator in AvatarBuilder (Layer 3).
// RULE: These are for UI indicators ONLY — they never replace the primary image.

export const CLOTHING_ACCENTS: Record<string, string> = {
  casual:     '#E8763A',
  athletic:   '#2A6AE8',
  business:   '#3D4F7A',
  streetwear: '#5A4A6A',
};

// ─── CLOTHING STYLE LABELS ────────────────────────────────────────────────────
// Human-readable labels for the clothing chip indicator.

export const CLOTHING_LABELS: Record<string, string> = {
  casual:     'Casual',
  athletic:   'Athletic',
  business:   'Business',
  streetwear: 'Streetwear',
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
