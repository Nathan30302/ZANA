export const colors = {
  primary: '#1A56DB',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#06B6D4',

  bg: {
    primary: '#FFFFFF',
    secondary: '#F5F7FB',
    tertiary: '#F3F4F6',
    error: '#FFF1F2',
  },

  text: {
    primary: '#0F172A',
    secondary: 'rgba(15, 23, 42, 0.7)',
    tertiary: 'rgba(15, 23, 42, 0.5)',
  },

  border: '#E6E9EE',
};

export const typography = {
  display: { fontSize: 28, lineHeight: 34 },
  h2: { fontSize: 22, lineHeight: 28 },
  h3: { fontSize: 18, lineHeight: 22 },
  bodyMedium: { fontSize: 16, lineHeight: 22 },
  body: { fontSize: 14, lineHeight: 20 },
  smallMedium: { fontSize: 13, lineHeight: 18 },
  small: { fontSize: 12, lineHeight: 16 },
  caption: { fontSize: 11, lineHeight: 14 },
};

export const spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 18,
  full: 9999,
};

export const shadows = {
  xs: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 12 },
};

export default { colors, typography, spacing, radius, shadows };
