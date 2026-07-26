'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

type Application = {
  id: string;
  displayName: string;
  area: string;
  type: string;
  status: string;
  user: { phone: string; name: string | null };
};

type Stats = {
  users: number;
  providers: number;
  bookings: number;
  pendingApps: number;
};

export default function AdminPage() {
  const [phone, setPhone] = useState('+260970000099');
  const [code, setCode] = useState('123456');
  const [token, setToken] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState('');

  async function login(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      const res = await api<{ token: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      setToken(res.token);
      const [s, a] = await Promise.all([
        api<Stats>('/admin/stats', { token: res.token }),
        api<Application[]>('/admin/applications', { token: res.token }),
      ]);
      setStats(s);
      setApps(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    await api(`/admin/applications/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
    const a = await api<Application[]>('/admin/applications', { token });
    const s = await api<Stats>('/admin/stats', { token });
    setApps(a);
    setStats(s);
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <p style={{ letterSpacing: '0.2em', fontSize: 12, color: 'var(--gold)' }}>
        admin.zana.zm
      </p>
      <h1 style={{ marginTop: 8 }}>ZANA Admin</h1>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {!token ? (
        <form onSubmit={login} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
          <p style={{ color: 'var(--muted)' }}>
            Seed admin phone: <code>+260970000099</code> · OTP <code>123456</code>
          </p>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input value={code} onChange={(e) => setCode(e.target.value)} />
          <button type="submit">Sign in</button>
        </form>
      ) : (
        <>
          {stats ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                margin: '20px 0',
              }}
            >
              {(
                [
                  ['Users', stats.users],
                  ['Providers', stats.providers],
                  ['Bookings', stats.bookings],
                  ['Pending', stats.pendingApps],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</div>
                </div>
              ))}
            </div>
          ) : null}

          <h2>Applications</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {apps.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No applications yet.</p>
            ) : (
              apps.map((app) => (
                <div
                  key={app.id}
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong>{app.displayName}</strong> · {app.type} · {app.area}
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {app.user.phone} · {app.status}
                    </div>
                  </div>
                  {app.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => review(app.id, 'APPROVED')}>
                        Approve
                      </button>
                      <button type="button" onClick={() => review(app.id, 'REJECTED')}>
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
