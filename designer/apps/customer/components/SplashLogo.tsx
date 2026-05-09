import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

// Try to use react-native-svg if available for crisp vector rendering.
let Svg: any = null;
let Path: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rns = require('react-native-svg');
  Svg = rns.Svg || rns.default?.Svg || rns;
  Path = rns.Path || rns.default?.Path || rns;
} catch (e) {
  Svg = null;
  Path = null;
}

export default function SplashLogo({ size = 88 }: { size?: number }) {
  if (Svg && Path) {
    return (
      // Render a simple elegant monogram mark using SVG paths
      // This keeps the brand mark vector and crisp on any screen.
      // The path is a stylized 'Z' monogram.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      <Svg width={size} height={size} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Path d="M12 18 L88 18 L32 82 L88 82" fill="none" stroke="#0F172A" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
      </Svg>
    );
  }

  // Fallback: inline SVG data URI rendered inside Image
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
      <path d='M12 18 L88 18 L32 82 L88 82' fill='none' stroke='%230F172A' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' opacity='0.95'/>
    </svg>
  `);
  const uri = `data:image/svg+xml;utf8,${svg}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}> 
      <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
