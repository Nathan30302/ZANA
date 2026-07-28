import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(1200px 700px at 80% 10%, rgba(217,119,6,0.22), transparent 55%), linear-gradient(165deg, #1c1917 0%, #292524 48%, #3f2a1c 100%)',
        color: '#faf7f2',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(250,247,242,0.06) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage:
            'linear-gradient(180deg, rgba(0,0,0,0.55), transparent 85%)',
          animation: 'softPulse 8s ease-in-out infinite',
        }}
      />
      <img
        aria-hidden
        src="/brand/zana-logo.png"
        alt=""
        style={{
          position: 'absolute',
          right: '-2%',
          top: '14%',
          width: 'min(46vw, 400px)',
          opacity: 0.22,
          pointerEvents: 'none',
          animation: 'riseIn 1s ease 0.12s both',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1080,
          margin: '0 auto',
          padding: '28px 22px 64px',
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
            animation: 'riseIn 0.6s ease both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/zana-logo.png" alt="ZANA" width={48} height={48} />
            <span
              className="brand-wordmark"
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.22em',
              }}
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
                color: 'rgba(250,247,242,0.7)',
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
            gap: 18,
            padding: '72px 0 48px',
            maxWidth: 720,
            animation: 'riseIn 0.75s ease 0.08s both',
          }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--copper-soft)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: 13,
            }}
          >
            Lusaka · Salons &amp; barbershops
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(42px, 8vw, 72px)',
              lineHeight: 0.98,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            Style at your
            <br />
            fingertips
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(17px, 2.4vw, 20px)',
              color: 'rgba(250,247,242,0.78)',
              maxWidth: 520,
            }}
          >
            Book a cut, fade, or salon session nearby — or send a mobile stylist
            to your door.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
            <Link href="/apply" className="btn-primary">
              Become a Professional
            </Link>
            <a href="#how" className="btn-ghost">
              How ZANA works
            </a>
          </div>
        </section>

        <section
          id="how"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            animation: 'riseIn 0.8s ease 0.16s both',
          }}
        >
          {[
            ['Discover', 'Find verified salons, barbers, and mobile pros around Lusaka.'],
            ['Book', 'Request a service. Pros accept and burn one float credit.'],
            ['Look fresh', 'Track the job, rate the finish, save your favourites.'],
          ].map(([title, copy]) => (
            <div
              key={title}
              style={{
                padding: '18px 16px',
                borderRadius: 16,
                background: 'rgba(250,247,242,0.06)',
                border: '1px solid rgba(250,247,242,0.1)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 6,
                }}
              >
                {title}
              </div>
              <p style={{ margin: 0, color: 'rgba(250,247,242,0.7)', fontSize: 14 }}>
                {copy}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
