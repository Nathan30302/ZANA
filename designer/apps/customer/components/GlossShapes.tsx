import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function GlossShapes() {
  return (
    <Svg width={width} height={height} style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#fff" stopOpacity="0.06" />
          <Stop offset="100%" stopColor="#fff" stopOpacity="0.00" />
        </LinearGradient>
      </Defs>

      <Path
        d={`M${-width * 0.25},${height * 0.18} C ${width * 0.1},${height * 0.05} ${width * 0.6},${height * 0.02} ${width * 0.95},${height * 0.12} L ${width * 0.95},${height * 0.20} C ${width * 0.6},${height * 0.10} ${width * 0.2},${height * 0.14} ${-width * 0.25},${height * 0.18} Z`}
        fill="url(#g1)"
        opacity={0.04}
      />

      <Path
        d={`M${width * 0.08},${height * 0.58} C ${width * 0.25},${height * 0.50} ${width * 0.6},${height * 0.48} ${width * 0.9},${height * 0.62} L ${width * 0.9},${height * 0.66} C ${width * 0.6},${height * 0.58} ${width * 0.28},${height * 0.62} ${width * 0.08},${height * 0.58} Z`}
        fill="#ffffff"
        opacity={0.025}
      />
    </Svg>
  );
}
