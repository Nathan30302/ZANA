// Premium Design System for ZANA

export const colors = {
  // Primary Brand
  primary: '#1A56DB',
  primaryLight: '#3B82F6',
  primaryDark: '#0D47A1',
  
  // Accents & Semantics
  accent: '#FF6B47',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  
  // Text Hierarchy
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
    inverse: '#FFFFFF',
  },
  
  // Backgrounds
  bg: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#1F2937',
  },
  
  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const typography = {
  // Display
  display: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  
  // Body
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  // Small
  small: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  smallMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  
  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};
