import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <p style={{ letterSpacing: '0.2em', fontSize: 12, color: 'var(--gold)' }}>
        ZANA
      </p>
      <h1 style={{ fontSize: 42, lineHeight: 1.1, margin: '8px 0 16px' }}>
        Beauty marketplace for Zambia
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 520 }}>
        Book salons, barbers, and mobile stylists. Pros earn through floats —
        simple, verified, Lusaka-first.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
        <Link
          href="/apply"
          style={{
            background: 'var(--charcoal)',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 10,
          }}
        >
          Become a Professional
        </Link>
        <Link
          href="/admin"
          style={{
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            padding: '12px 18px',
            borderRadius: 10,
          }}
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
