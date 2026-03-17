/**
 * Avatar Asset System
 * 2 base characters × 4 clothing × 5 hairstyles = modular 960-combination system
 * Masculine / Feminine bases only — Neutral maps to one of the two
 */

// ─── BASE CHARACTER BODY IMAGES ───────────────────────────────────────────────
// Keyed by: `${base}_${clothing}`

export const BODY_IMAGES: Record<string, any> = {
  m_casual:      require('@/assets/avatars/base_m_casual.png'),
  m_athletic:    require('@/assets/avatars/base_m_athletic.png'),
  m_business:    require('@/assets/avatars/base_m_business.png'),
  m_streetwear:  require('@/assets/avatars/base_m_streetwear.png'),
  f_casual:      require('@/assets/avatars/base_f_casual.png'),
  f_athletic:    require('@/assets/avatars/base_f_athletic.png'),
  f_business:    require('@/assets/avatars/base_f_business.png'),
  f_streetwear:  require('@/assets/avatars/base_f_streetwear.png'),
};

// ─── HAIRSTYLE FACE/HEAD IMAGES ───────────────────────────────────────────────
// Keyed by: `${base}_${hairstyle}`

export const HAIR_IMAGES: Record<string, any> = {
  m_short:    require('@/assets/avatars/hair_m_short.png'),
  m_medium:   require('@/assets/avatars/hair_m_medium.png'),
  m_long:     require('@/assets/avatars/hair_m_long.png'),
  m_buzz:     require('@/assets/avatars/hair_m_buzz.png'),
  m_bald:     require('@/assets/avatars/hair_m_bald.png'),
  f_short:    require('@/assets/avatars/hair_f_short.png'),
  f_medium:   require('@/assets/avatars/hair_f_medium.png'),
  f_long:     require('@/assets/avatars/hair_f_long.png'),
  f_buzz:     require('@/assets/avatars/hair_f_buzz.png'),
  f_bald:     require('@/assets/avatars/hair_f_bald.png'),
};

// ─── GENDER → BASE CHARACTER MAPPING ─────────────────────────────────────────
// Neutral maps to masculine base — no third character variant

export type BaseChar = 'm' | 'f';

export function genderToBase(genderPresentation: string): BaseChar {
  return genderPresentation === 'feminine' ? 'f' : 'm';
}

// ─── SKIN TONE OVERLAY COLORS ─────────────────────────────────────────────────
// Used to tint the skin-tone indicator ring and contextual UI elements

export const SKIN_TONES: Record<string, { color: string; label: string }> = {
  tone1: { color: '#FDDBB4', label: 'Very Light' },
  tone2: { color: '#F0C27F', label: 'Light' },
  tone3: { color: '#D4956A', label: 'Medium Light' },
  tone4: { color: '#A0612A', label: 'Medium' },
  tone5: { color: '#6B3A1F', label: 'Dark' },
  tone6: { color: '#2E1508', label: 'Very Dark' },
};

// ─── BODY TYPE SCALE FACTORS ──────────────────────────────────────────────────
// Applied to full-body image container for silhouette variation

export const BODY_TYPE_SCALES: Record<string, { scaleX: number; scaleY: number }> = {
  lean:     { scaleX: 0.85, scaleY: 1.03 },
  average:  { scaleX: 1.00, scaleY: 1.00 },
  athletic: { scaleX: 1.08, scaleY: 1.00 },
  broad:    { scaleX: 1.16, scaleY: 0.98 },
};

// ─── CLOTHING STYLE ACCENT COLORS ─────────────────────────────────────────────

export const CLOTHING_ACCENTS: Record<string, string> = {
  casual:     '#E8763A',
  athletic:   '#2A2A2A',
  business:   '#3D4F7A',
  streetwear: '#4A4A4A',
};

// ─── HAIRSTYLE METADATA ───────────────────────────────────────────────────────

export const HAIRSTYLE_META: Record<string, { label: string; hairHeightFactor: number }> = {
  short:  { label: 'Short',    hairHeightFactor: 0.0  },
  medium: { label: 'Medium',   hairHeightFactor: 0.04 },
  long:   { label: 'Long',     hairHeightFactor: 0.08 },
  buzz:   { label: 'Buzz Cut', hairHeightFactor: -0.03 },
  bald:   { label: 'Bald',     hairHeightFactor: -0.06 },
};
