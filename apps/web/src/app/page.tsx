import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(1100px 640px at 85% 0%, rgba(194,65,12,0.28), transparent 55%), linear-gradient(165deg, #1c1917 0%, #292524 52%, #3f2a1c 100%)',
        color: '#faf7f2',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(250,247,242,0.055) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent 88%)',
          animation: 'softPulse 8s ease-in-out infinite',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/brand/zana-logo.png"
        alt=""
        style={{
          position: 'absolute',
          right: '-4%',
          bottom: '8%',
          width: 'min(58vw, 520px)',
          opacity: 0.2,
          pointerEvents: 'none',
          animation: 'brandGlow 7s ease-in-out infinite',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1080,
          margin: '0 auto',
          padding: '28px 22px 56px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            animation: 'riseIn 0.55s ease both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/zana-logo.png" alt="ZANA" width={44} height={44} />
            <span
              className="brand-wordmark"
              style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.22em' }}
            >
              ZANA
            </span>
          </div>
          <nav style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/apply" className="btn-ghost" style={{ padding: '10px 14px' }}>
              Become a Pro
            </Link>
            <Link
              href="/admin"
              style={{
                padding: '10px 14px',
                color: 'rgba(250,247,242,0.65)',
                fontWeight: 500,
              }}
            >
              Admin
            </Link>
          </nav>
        </header>

        <section
          style={{
            flex: 1,
            display: 'grid',
            alignContent: 'center',
            gap: 16,
            padding: '64px 0 40px',
            maxWidth: 760,
            animation: 'riseIn 0.7s ease 0.06s both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/zana-logo.png"
              alt=""
              width={72}
              height={72}
              style={{ borderRadius: 16 }}
            />
            <h1
              className="brand-wordmark"
              style={{
                margin: 0,
                fontSize: 'clamp(48px, 11vw, 92px)',
                lineHeight: 0.92,
                fontWeight: 800,
                letterSpacing: '0.14em',
              }}
            >
              ZANA
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(22px, 4vw, 34px)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--copper-soft)',
            }}
          >
            Style at your fingertips
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(16px, 2.2vw, 19px)',
              color: 'rgba(250,247,242,0.76)',
              maxWidth: 480,
            }}
          >
            Book Lusaka salons, barbers, and mobile stylists nearby — now or on
            the schedule.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <Link href="/apply" className="btn-copper">
              Become a Professional
            </Link>
            <a href="#how" className="btn-ghost">
              How it works
            </a>
          </div>
        </section>

        <section
          id="how"
          style={{
            display: 'grid',
            gap: 0,
            borderTop: '1px solid rgba(250,247,242,0.12)',
            paddingTop: 22,
            animation: 'riseIn 0.75s ease 0.14s both',
          }}
        >
          {[
            ['01', 'Discover', 'Verified shops and mobile pros near you.'],
            ['02', 'Book now', 'Request ASAP or schedule — track them live.'],
            ['03', 'Look fresh', 'Rate the finish and save favourites.'],
          ].map(([n, title, copy], i) => (
            <div
              key={title}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr',
                gap: 14,
                padding: '16px 0',
                borderBottom:
                  i < 2 ? '1px solid rgba(250,247,242,0.08)' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  color: 'var(--copper-soft)',
                  fontSize: 18,
                }}
              >
                {n}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 4,
                  }}
                >
                  {title}
                </div>
                <p style={{ margin: 0, color: 'rgba(250,247,242,0.68)', fontSize: 14 }}>
                  {copy}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
