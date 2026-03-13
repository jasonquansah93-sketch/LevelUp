// LevelUp - Design System
// Warm premium light theme — cream base, amber/gold accents, dark brown typography

export const Colors = {
  // ── Base Surfaces ──────────────────────────────────────────────────────────
  bg: '#EDE8DF',               // Warm cream — main app background
  surface: '#FAF7F1',          // Off-white warm card surface
  surfaceElevated: '#F5F0E8',  // Slightly deeper elevated card
  surfaceBorder: '#DDD6CB',    // Subtle warm border
  surfaceHover: '#F0EBE0',     // Pressed/hover state for rows

  // ── Brand Accent ───────────────────────────────────────────────────────────
  gold: '#C07A1A',             // Warm deep amber — primary brand color
  goldDim: '#A36515',          // Dimmed gold for pressed states
  goldSoft: '#F5E8CC',         // Very light amber tint — backgrounds
  goldGlow: 'rgba(192, 122, 26, 0.18)',
  amber: '#D4620E',            // Deeper orange-amber — streak fire icon

  // ── Semantic Colors ────────────────────────────────────────────────────────
  success: '#2A7A4E',
  successSoft: '#E2F1E9',
  error: '#B83030',
  errorSoft: '#FAE9E9',
  warning: '#C07A1A',
  warningSoft: '#F5E8CC',
  info: '#2A5A9C',
  infoSoft: '#E4ECF8',

  // ── Typography ─────────────────────────────────────────────────────────────
  textPrimary: '#2A1A0A',      // Very dark warm brown
  textSecondary: '#7A6550',    // Medium warm brown
  textMuted: '#B0978A',        // Light warm taupe
  textInverse: '#FFFFFF',      // White — for text on dark/gold fills

  // ── Category Colors (kept vibrant but slightly toned for light bg) ─────────
  fitness: '#D45A20',
  health: '#2A8A5C',
  sleep: '#6A5ACC',
  learning: '#2A6ACC',
  reading: '#8A5ACC',
  focus: '#C07A1A',
  discipline: '#C03A2A',
  order: '#2A9A96',
  career: '#C07A00',
  communication: '#C04A7A',
  finance: '#4A8A5A',
  social: '#D46A3A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#8A6A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#8A6A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 4,
  },
  gold: {
    shadowColor: '#C07A1A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
};

export const CategoryColors: Record<string, string> = {
  Fitness: Colors.fitness,
  Health: Colors.health,
  Sleep: Colors.sleep,
  Learning: Colors.learning,
  Reading: Colors.reading,
  Focus: Colors.focus,
  Discipline: Colors.discipline,
  Order: Colors.order,
  Career: Colors.career,
  Communication: Colors.communication,
  Finance: Colors.finance,
  Social: Colors.social,
};
