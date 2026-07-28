'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Application = {
  id: string;
  displayName: string;
  area: string;
  type: string;
  status: string;
  adminNote?: string | null;
  documentUrls?: string[];
  user: { phone: string; name: string | null };
};

type BookingRow = {
  id: string;
  status: string;
  priceZmw: number;
  createdAt: string;
  disputeNote?: string | null;
  creditBurned?: boolean;
  service: { name: string };
  provider: { id: string; displayName: string; area: string };
  customer: { phone: string; name: string | null };
};

type FloatPackage = {
  id: string;
  code: string;
  name: string;
  credits: number;
  priceZmw: number;
  isActive: boolean;
};

type Stats = {
  users: number;
  providers: number;
  bookings: number;
  pendingApps: number;
};

const TOKEN_KEY = 'zana_admin_token';

export default function AdminPage() {
  const [phone, setPhone] = useState('+260970000099');
  const [code, setCode] = useState('123456');
  const [token, setToken] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [packages, setPackages] = useState<FloatPackage[]>([]);
  const [error, setError] = useState('');
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [disputeDraft, setDisputeDraft] = useState<Record<string, string>>({});
  const [appQuery, setAppQuery] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [bookingQuery, setBookingQuery] = useState('');
  const [newPkg, setNewPkg] = useState({
    code: '',
    name: '',
    credits: 20,
    priceZmw: 250,
  });

  async function loadAll(
    t: string,
    opts?: { appQ?: string; bookingStatus?: string; bookingQ?: string },
  ) {
    const aq = opts?.appQ ?? appQuery;
    const bs = opts?.bookingStatus ?? bookingStatus;
    const bq = opts?.bookingQ ?? bookingQuery;
    const appsPath = `/admin/applications${aq ? `?q=${encodeURIComponent(aq)}` : ''}`;
    const bookingParams = new URLSearchParams();
    if (bs) bookingParams.set('status', bs);
    if (bq) bookingParams.set('q', bq);
    const bookingsPath = `/admin/bookings${
      bookingParams.toString() ? `?${bookingParams}` : ''
    }`;
    const [s, a, b, p] = await Promise.all([
      api<Stats>('/admin/stats', { token: t }),
      api<Application[]>(appsPath, { token: t }),
      api<BookingRow[]>(bookingsPath, { token: t }),
      api<FloatPackage[]>('/admin/float-packages', { token: t }),
    ]);
    setStats(s);
    setApps(a);
    setBookings(b);
    setPackages(p);
  }

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    setToken(saved);
    loadAll(saved).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
    });
  }, []);

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
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      await loadAll(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function review(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO',
  ) {
    if (!token) return;
    const adminNote = noteDraft[id]?.trim();
    if (status === 'NEEDS_INFO' && !adminNote) {
      setError('Add a note before marking Needs info');
      return;
    }
    await api(`/admin/applications/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status, adminNote: adminNote || undefined }),
    });
    await loadAll(token);
  }

  async function togglePackage(pkg: FloatPackage) {
    if (!token) return;
    await api(`/admin/float-packages/${pkg.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    await loadAll(token);
  }

  async function savePackagePrice(pkg: FloatPackage, priceZmw: number) {
    if (!token) return;
    await api(`/admin/float-packages/${pkg.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ priceZmw }),
    });
    await loadAll(token);
  }

  async function createPackage(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api('/admin/float-packages', {
      method: 'POST',
      token,
      body: JSON.stringify(newPkg),
    });
    setNewPkg({ code: '', name: '', credits: 20, priceZmw: 250 });
    await loadAll(token);
  }

  async function saveDispute(id: string) {
    if (!token) return;
    await api(`/admin/bookings/${id}/dispute`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ disputeNote: disputeDraft[id] ?? '' }),
    });
    await loadAll(token);
  }

  async function forceStatus(id: string, status: string, refundCredit = false) {
    if (!token) return;
    await api(`/admin/bookings/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({
        status,
        refundCredit,
        note: `Forced to ${status}`,
      }),
    });
    await loadAll(token);
  }

  async function adjustCredits(providerId: string, delta: number) {
    if (!token) return;
    await api(`/admin/providers/${providerId}/credits`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ delta }),
    });
    await loadAll(token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setStats(null);
    setApps([]);
    setBookings([]);
    setPackages([]);
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/zana-mark.svg" alt="ZANA" width={40} height={40} />
          <div>
            <div
              className="brand-wordmark"
              style={{ fontWeight: 800, letterSpacing: '0.18em', fontSize: 18 }}
            >
              ZANA Admin
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Style at your fingertips · ops
            </div>
          </div>
        </div>
        {token ? (
          <button type="button" onClick={logout}>
            Sign out
          </button>
        ) : null}
      </div>

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadAll(token, { appQ: appQuery });
            }}
            style={{ display: 'flex', gap: 8, marginBottom: 12 }}
          >
            <input
              placeholder="Search name, area, phone"
              value={appQuery}
              onChange={(e) => setAppQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit">Search</button>
          </form>
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
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{app.displayName}</strong> · {app.type} · {app.area}
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {app.user.phone} · {app.status}
                      </div>
                      {app.adminNote ? (
                        <div style={{ fontSize: 13, marginTop: 4 }}>Note: {app.adminNote}</div>
                      ) : null}
                      {app.documentUrls && app.documentUrls.length > 0 ? (
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          Docs:{' '}
                          {app.documentUrls.map((url, i) => (
                            <span key={url}>
                              {i > 0 ? ' · ' : ''}
                              <a href={url} target="_blank" rel="noreferrer">
                                file {i + 1}
                              </a>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {app.status === 'PENDING' || app.status === 'NEEDS_INFO' ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => review(app.id, 'APPROVED')}>
                          Approve
                        </button>
                        <button type="button" onClick={() => review(app.id, 'NEEDS_INFO')}>
                          Needs info
                        </button>
                        <button type="button" onClick={() => review(app.id, 'REJECTED')}>
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {(app.status === 'PENDING' || app.status === 'NEEDS_INFO') && (
                    <input
                      placeholder="Admin note (required for Needs info)"
                      value={noteDraft[app.id] ?? ''}
                      onChange={(e) =>
                        setNoteDraft((prev) => ({ ...prev, [app.id]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <h2 style={{ marginTop: 36 }}>Recent bookings</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadAll(token, {
                bookingStatus,
                bookingQ: bookingQuery,
              });
            }}
            style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}
          >
            <select
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {[
                'REQUESTED',
                'ACCEPTED',
                'CONFIRMED',
                'ON_THE_WAY',
                'IN_SERVICE',
                'COMPLETED',
                'CANCELLED',
                'DECLINED',
                'EXPIRED',
                'RATED',
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              placeholder="Search service, pro, phone, dispute"
              value={bookingQuery}
              onChange={(e) => setBookingQuery(e.target.value)}
              style={{ flex: 1, minWidth: 180 }}
            />
            <button type="submit">Filter</button>
          </form>
          <div style={{ display: 'grid', gap: 10 }}>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No bookings match.</p>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 14,
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{b.service.name}</strong> · {b.status} · K{b.priceZmw}
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {b.provider.displayName} · {b.customer.name ?? b.customer.phone} ·{' '}
                        {new Date(b.createdAt).toLocaleString()}
                      </div>
                      {b.disputeNote ? (
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          Dispute: {b.disputeNote}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      placeholder="Dispute / ops note"
                      value={disputeDraft[b.id] ?? b.disputeNote ?? ''}
                      onChange={(e) =>
                        setDisputeDraft((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                      style={{ flex: 1, minWidth: 200 }}
                    />
                    <button type="button" onClick={() => saveDispute(b.id)}>
                      Save note
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => forceStatus(b.id, 'CANCELLED', true)}
                    >
                      Force cancel (+refund)
                    </button>
                    <button
                      type="button"
                      onClick={() => forceStatus(b.id, 'COMPLETED')}
                    >
                      Force complete
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustCredits(b.provider.id, 1)}
                    >
                      +1 float
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustCredits(b.provider.id, -1)}
                    >
                      −1 float
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 style={{ marginTop: 36 }}>Float packages</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <strong>
                  {pkg.name} ({pkg.code})
                </strong>
                <span style={{ color: 'var(--muted)' }}>{pkg.credits} credits</span>
                <label>
                  K{' '}
                  <input
                    type="number"
                    defaultValue={pkg.priceZmw}
                    style={{ width: 90 }}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isNaN(next) && next !== pkg.priceZmw) {
                        void savePackagePrice(pkg, next);
                      }
                    }}
                  />
                </label>
                <button type="button" onClick={() => togglePackage(pkg)}>
                  {pkg.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={createPackage}
            style={{
              marginTop: 16,
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(4, 1fr) auto',
              alignItems: 'end',
            }}
          >
            <label>
              Code
              <input
                value={newPkg.code}
                onChange={(e) => setNewPkg({ ...newPkg, code: e.target.value })}
                required
              />
            </label>
            <label>
              Name
              <input
                value={newPkg.name}
                onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                required
              />
            </label>
            <label>
              Credits
              <input
                type="number"
                value={newPkg.credits}
                onChange={(e) =>
                  setNewPkg({ ...newPkg, credits: Number(e.target.value) })
                }
                required
              />
            </label>
            <label>
              Price K
              <input
                type="number"
                value={newPkg.priceZmw}
                onChange={(e) =>
                  setNewPkg({ ...newPkg, priceZmw: Number(e.target.value) })
                }
                required
              />
            </label>
            <button type="submit">Add package</button>
          </form>
        </>
      )}
    </main>
  );
}
