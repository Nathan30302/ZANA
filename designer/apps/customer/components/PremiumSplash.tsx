import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { SvgXml } from 'react-native-svg';
import GlossShapes from './GlossShapes';
import { NOISE_SVG } from './NoiseSvg';

const { width, height } = Dimensions.get('window');

export default function PremiumSplash({ onFinish, duration = 2500, fontFamily }: { onFinish?: () => void; duration?: number; fontFamily?: string }) {
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // continuous, slow color shifting (crossfade between two gradient sets)
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // logo entrance
    Animated.parallel([
      Animated.timing(logoScale, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // total splash duration then fade
    const t = setTimeout(() => {
      Animated.timing(containerOpacity, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => {
        onFinish && onFinish();
      });
    }, duration);

    return () => clearTimeout(t);
  }, [duration]);

  // interpolate gradient crossfade
  const gradAOpacity = gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  const gradBOpacity = gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}> 
      {/* Gradient layer A */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradAOpacity }]}> 
        <LinearGradient
          colors={['#08126B', '#5B2A86', '#E24C6B']}
          start={[0.1, 0]}
          end={[0.9, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Gradient layer B (crossfades slowly) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradBOpacity }]}> 
        <LinearGradient
          colors={['#0D1A5A', '#4B2A7A', '#FF6A88']}
          start={[0, 0.2]}
          end={[1, 0.8]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Floating blurred shapes (SVG circles behind content) */}
      <View style={styles.shapesWrap} pointerEvents="none">
        <Svg width={width} height={height} style={{ position: 'absolute' }}>
          <Circle cx={width * 0.2} cy={height * 0.18} r={150} fill="#ffffff" opacity={0.05} />
          <Circle cx={width * 0.85} cy={height * 0.75} r={180} fill="#ffffff" opacity={0.04} />
          <Rect x={-50} y={height * 0.45} width={width * 1.4} height={120} fill="#ffffff" opacity={0.02} transform={`rotate(-12 ${width/2} ${height/2})`} />
        </Svg>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      </View>

      {/* Noise overlay rendered from SVG for adjustable quality */}
      <SvgXml xml={NOISE_SVG} width={width} height={height} style={styles.noise} />

      {/* Refined glossy shapes component */}
      <GlossShapes />

      {/* Center brand */}
      <Animated.View style={[styles.brandWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}> 
        <Text style={[styles.logo, fontFamily ? { fontFamily } : undefined]}>ZANA</Text>
        <Text style={styles.slogan}>Beauty at Your Fingertips</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1340',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapesWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  gloss: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
  },
  noise: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  brandWrap: {
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    fontSize: 56,
    fontWeight: '700',
    color: '#0E3A9A',
    textShadowColor: 'rgba(14,58,154,0.14)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 18,
    letterSpacing: 2,
  },
  slogan: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    opacity: 0.9,
  },
});
