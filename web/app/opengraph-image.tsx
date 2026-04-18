import { ImageResponse } from 'next/og';

export const alt = 'Mogster — Your Aura. Rated. No Cap.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Note: ImageResponse uses Satori under the hood. System/fallback fonts only
// (loading Anton would require bundling the .ttf as an ArrayBuffer). The
// Impact fallback is close enough to Anton for an OG preview.
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FFD60A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        {/* Top hazard stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            background:
              'repeating-linear-gradient(45deg, #0A0A0A 0px, #0A0A0A 16px, #FFD60A 16px, #FFD60A 32px)',
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 240,
            fontFamily: 'Impact, "Arial Narrow", sans-serif',
            fontWeight: 900,
            color: '#0A0A0A',
            letterSpacing: -6,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          MOGSTER
          <span style={{ fontSize: 240, color: '#0A0A0A' }}>.</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 32,
            fontSize: 44,
            color: '#0A0A0A',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          YOUR AURA. RATED. NO CAP.
        </div>

        {/* Bottom hazard stripe */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background:
              'repeating-linear-gradient(45deg, #0A0A0A 0px, #0A0A0A 16px, #FFD60A 16px, #FFD60A 32px)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
