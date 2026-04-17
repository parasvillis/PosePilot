// PosePilot design tokens (derived from /app/design_guidelines.json)
export const colors = {
  bg: '#000000',
  bg2: '#121212',
  surface: 'rgba(28, 28, 30, 0.7)',
  surfaceSolid: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(235, 235, 245, 0.7)',
  textMuted: 'rgba(235, 235, 245, 0.45)',
  accent: '#FFD60A',
  accentFg: '#000000',
  success: '#32D74B',
  error: '#FF453A',
  border: 'rgba(255, 255, 255, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 9999,
};

export const typography = {
  h1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  bodyLg: { fontSize: 17, fontWeight: '400' as const },
  bodyMd: { fontSize: 15, fontWeight: '400' as const },
  bodySm: { fontSize: 13, fontWeight: '500' as const },
  mono: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.5 },
};
