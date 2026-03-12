// LevelUp - Design System
// Premium dark-first design tokens

export const Colors = {
  // Base surfaces
  bg: '#0F0F13',
  surface: '#1A1A22',
  surfaceElevated: '#22222E',
  surfaceBorder: '#2A2A38',
  surfaceHover: '#2E2E3E',

  // Brand
  gold: '#F5C842',
  goldDim: '#C9A22A',
  goldSoft: 'rgba(245, 200, 66, 0.12)',
  goldGlow: 'rgba(245, 200, 66, 0.25)',
  amber: '#F5A623',

  // Semantic
  success: '#3DD68C',
  successSoft: 'rgba(61, 214, 140, 0.12)',
  error: '#FF5757',
  errorSoft: 'rgba(255, 87, 87, 0.12)',
  warning: '#FFB347',
  warningSoft: 'rgba(255, 179, 71, 0.12)',
  info: '#5E9BFF',
  infoSoft: 'rgba(94, 155, 255, 0.12)',

  // Text
  textPrimary: '#F0F0F5',
  textSecondary: '#8888A0',
  textMuted: '#55556A',
  textInverse: '#0F0F13',

  // Categories
  fitness: '#FF6B35',
  health: '#3DD68C',
  sleep: '#7B68EE',
  learning: '#5E9BFF',
  reading: '#A78BFA',
  focus: '#F5C842',
  discipline: '#FF5757',
  order: '#4ECDC4',
  career: '#F5A623',
  communication: '#FF8FAB',
  finance: '#98D4A3',
  social: '#FFA07A',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gold: {
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
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
