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

  function statusBadge(status: string) {
    if (status === 'APPROVED' || status === 'COMPLETED' || status === 'RATED') {
      return 'badge badge-ok';
    }
    if (status === 'REJECTED' || status === 'CANCELLED' || status === 'DECLINED') {
      return 'badge badge-danger';
    }
    if (status === 'PENDING' || status === 'NEEDS_INFO' || status === 'REQUESTED') {
      return 'badge badge-warn';
    }
    return 'badge';
  }

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/zana-logo.png" alt="ZANA" />
          <div>
            <div className="brand-wordmark" style={{ fontWeight: 800, letterSpacing: '0.18em', fontSize: 18 }}>
              ZANA Admin
            </div>
            <div className="brand-kicker">Style at your fingertips · ops</div>
          </div>
        </div>
        {token ? (
          <button type="button" className="btn-secondary btn-sm" onClick={logout}>
            Sign out
          </button>
        ) : null}
      </div>

      {error ? <p className="error">{error}</p> : null}

      {!token ? (
        <section className="panel" style={{ maxWidth: 420 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Sign in</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Seed admin: <code>+260970000099</code> · OTP <code>123456</code>
          </p>
          <form onSubmit={login} className="stack" style={{ marginTop: 18 }}>
            <label className="field">
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="field">
              OTP code
              <input value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <button type="submit" className="btn-copper">
              Sign in
            </button>
          </form>
        </section>
      ) : (
        <>
          {stats ? (
            <div className="stats">
              {(
                [
                  ['Users', stats.users, ''],
                  ['Providers', stats.providers, ''],
                  ['Bookings', stats.bookings, ''],
                  ['Pending', stats.pendingApps, 'pending'],
                ] as const
              ).map(([label, value, cls]) => (
                <div className={`stat${cls ? ` ${cls}` : ''}`} key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <h2 className="section-title">Applications</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadAll(token, { appQ: appQuery });
            }}
            className="toolbar"
          >
            <input
              className="input"
              placeholder="Search name, area, phone"
              value={appQuery}
              onChange={(e) => setAppQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary btn-sm">
              Search
            </button>
          </form>
          <div className="list">
            {apps.length === 0 ? (
              <p className="empty-panel">No applications yet.</p>
            ) : (
              apps.map((app) => (
                <div className="card" key={app.id}>
                  <div className="card-head">
                    <div>
                      <strong>{app.displayName}</strong>
                      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                        {app.type} · {app.area} · {app.user.phone}
                      </div>
                      {app.adminNote ? (
                        <div style={{ fontSize: 13, marginTop: 6 }}>Note: {app.adminNote}</div>
                      ) : null}
                      {app.documentUrls && app.documentUrls.length > 0 ? (
                        <div className="row" style={{ marginTop: 8 }}>
                          {app.documentUrls.map((url, i) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer" className="badge">
                              file {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <span className={statusBadge(app.status)}>{app.status}</span>
                  </div>
                  {(app.status === 'PENDING' || app.status === 'NEEDS_INFO') && (
                    <input
                      className="input"
                      placeholder="Admin note (required for Needs info)"
                      value={noteDraft[app.id] ?? ''}
                      onChange={(e) =>
                        setNoteDraft((prev) => ({ ...prev, [app.id]: e.target.value }))
                      }
                    />
                  )}
                  {app.status === 'PENDING' || app.status === 'NEEDS_INFO' ? (
                    <div className="row">
                      <button type="button" className="btn-primary btn-sm" onClick={() => review(app.id, 'APPROVED')}>
                        Approve
                      </button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => review(app.id, 'NEEDS_INFO')}>
                        Needs info
                      </button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => review(app.id, 'REJECTED')}>
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <h2 className="section-title">Recent bookings</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadAll(token, {
                bookingStatus,
                bookingQ: bookingQuery,
              });
            }}
            className="toolbar"
          >
            <select
              className="select"
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
              className="input"
              placeholder="Search service, pro, phone, dispute"
              value={bookingQuery}
              onChange={(e) => setBookingQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary btn-sm">
              Filter
            </button>
          </form>
          <div className="list">
            {bookings.length === 0 ? (
              <p className="empty-panel">No bookings match.</p>
            ) : (
              bookings.map((b) => (
                <div className="card" key={b.id}>
                  <div className="card-head">
                    <div>
                      <strong>{b.service.name}</strong>
                      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                        K{b.priceZmw} · {b.provider.displayName} · {b.customer.name ?? b.customer.phone}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {new Date(b.createdAt).toLocaleString()}
                      </div>
                      {b.disputeNote ? (
                        <div style={{ fontSize: 13, marginTop: 6 }}>Dispute: {b.disputeNote}</div>
                      ) : null}
                    </div>
                    <span className={statusBadge(b.status)}>{b.status}</span>
                  </div>
                  <div className="row">
                    <input
                      className="input"
                      placeholder="Dispute / ops note"
                      value={disputeDraft[b.id] ?? b.disputeNote ?? ''}
                      onChange={(e) =>
                        setDisputeDraft((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                      style={{ flex: 1, minWidth: 200 }}
                    />
                    <button type="button" className="btn-secondary btn-sm" onClick={() => saveDispute(b.id)}>
                      Save note
                    </button>
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => forceStatus(b.id, 'CANCELLED', true)}
                    >
                      Force cancel (+refund)
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => forceStatus(b.id, 'COMPLETED')}
                    >
                      Force complete
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => adjustCredits(b.provider.id, 1)}
                    >
                      +1 float
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => adjustCredits(b.provider.id, -1)}
                    >
                      −1 float
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="section-title">Float packages</h2>
          <div className="list">
            {packages.map((pkg) => (
              <div className="card" key={pkg.id}>
                <div className="card-head">
                  <div>
                    <strong>
                      {pkg.name} ({pkg.code})
                    </strong>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {pkg.credits} credits
                    </div>
                  </div>
                  <span className={pkg.isActive ? 'badge badge-ok' : 'badge'}>
                    {pkg.isActive ? 'Active' : 'Off'}
                  </span>
                </div>
                <div className="row">
                  <label className="field" style={{ minWidth: 120 }}>
                    Price K
                    <input
                      type="number"
                      defaultValue={pkg.priceZmw}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (!Number.isNaN(next) && next !== pkg.priceZmw) {
                          void savePackagePrice(pkg, next);
                        }
                      }}
                    />
                  </label>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => togglePackage(pkg)}>
                    {pkg.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={createPackage} className="panel" style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px' }}>Add package</h3>
            <div
              style={{
                display: 'grid',
                gap: 10,
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                alignItems: 'end',
              }}
            >
              <label className="field">
                Code
                <input
                  value={newPkg.code}
                  onChange={(e) => setNewPkg({ ...newPkg, code: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                Name
                <input
                  value={newPkg.name}
                  onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                  required
                />
              </label>
              <label className="field">
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
              <label className="field">
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
              <button type="submit" className="btn-primary">
                Add package
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
