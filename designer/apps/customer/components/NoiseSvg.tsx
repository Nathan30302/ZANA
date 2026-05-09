// Simple SVG noise using feTurbulence; rendered via SvgXml in PremiumSplash
export const NOISE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <filter id="n" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="t"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncA type="table" tableValues="0 0.12" />
    </feComponentTransfer>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)" opacity="0.08" />
</svg>
`;

export default NOISE_SVG;
