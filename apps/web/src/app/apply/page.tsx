'use client';

import { FormEvent, useEffect, useState, type ChangeEvent } from 'react';
import { api } from '@/lib/api';

type Step = 'otp' | 'form' | 'status';

type Application = {
  id: string;
  displayName: string;
  area: string;
  type: string;
  status: string;
  notes?: string | null;
  adminNote?: string | null;
  documentUrls?: string[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1').replace(
  /\/v1\/?$/,
  '',
);
const TOKEN_KEY = 'zana_apply_token';

export default function ApplyPage() {
  const [step, setStep] = useState<Step>('otp');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+260');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [form, setForm] = useState({
    type: 'INDEPENDENT',
    displayName: '',
    area: 'Roma',
    notes: '',
  });

  async function loadMine(t: string) {
    const app = await api<Application | null>('/applications/me', { token: t });
    if (app) {
      setApplication(app);
      setForm({
        type: app.type,
        displayName: app.displayName,
        area: app.area,
        notes: app.notes ?? '',
      });
      setDocumentUrls(app.documentUrls ?? []);
      if (app.status === 'NEEDS_INFO') {
        setStep('form');
      } else {
        setStep('status');
      }
    } else {
      setStep('form');
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    setToken(saved);
    loadMine(saved).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
    });
  }, []);

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api<{ token: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          code,
          ...(name.trim() ? { name: name.trim() } : {}),
        }),
      });
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      if (name.trim() && !form.displayName) {
        setForm((f) => ({ ...f, displayName: name.trim() }));
      }
      await loadMine(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    }
  }

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !token) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      Array.from(files).forEach((f) => body.append('files', f));
      const res = await fetch(`${API_BASE}/v1/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { urls: string[] };
      setDocumentUrls((prev) => [...prev, ...data.urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function submitApplication(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (application && (application.status === 'NEEDS_INFO' || application.status === 'PENDING')) {
        const updated = await api<Application>('/applications/me', {
          method: 'PATCH',
          token,
          body: JSON.stringify({ ...form, documentUrls }),
        });
        setApplication(updated);
      } else {
        const created = await api<Application>('/applications', {
          method: 'POST',
          token,
          body: JSON.stringify({ ...form, documentUrls }),
        });
        setApplication(created);
      }
      setStep('status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  }

  return (
    <main className="shell shell-narrow">
      <div className="brand-row" style={{ marginBottom: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/zana-logo.png" alt="ZANA" />
        <div>
          <div className="brand-wordmark" style={{ fontWeight: 800, letterSpacing: '0.18em', fontSize: 18 }}>
            ZANA
          </div>
          <div className="brand-kicker">Style at your fingertips</div>
        </div>
      </div>
      <h1 style={{ marginTop: 8, fontSize: 34, lineHeight: 1.12 }}>Become a Professional</h1>
      <p className="muted">
        Apply once. ZANA reviews your docs, then you download ZANA Pro and buy
        your first float.
      </p>

      {error ? <p className="error">{error}</p> : null}

      {step === 'otp' ? (
        <form onSubmit={verifyOtp} className="panel stack" style={{ marginTop: 24 }}>
          <label className="field">
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Phone (+260)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <button type="button" onClick={requestOtp} className="btn-secondary">
            Send OTP
          </button>
          <label className="field">
            OTP code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456 in dev"
              required
            />
          </label>
          <button type="submit" className="btn-primary">
            Continue
          </button>
        </form>
      ) : null}

      {step === 'form' ? (
        <form onSubmit={submitApplication} className="panel stack" style={{ marginTop: 24 }}>
          {application?.status === 'NEEDS_INFO' ? (
            <div className="card" style={{ boxShadow: 'none' }}>
              <strong>More info needed</strong>
              <p className="muted" style={{ margin: 0 }}>
                {application.adminNote || 'Please update your application and resubmit.'}
              </p>
            </div>
          ) : null}
          <label className="field">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="INDEPENDENT">Independent (mobile)</option>
              <option value="SALON">Salon</option>
              <option value="BARBERSHOP">Barbershop</option>
            </select>
          </label>
          <label className="field">
            Display name
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Area (Lusaka)
            <select
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            >
              {[
                'Roma',
                'Kabulonga',
                'CBD',
                'Woodlands',
                'Rhodes Park',
                'Olympia',
                'Chilanga',
                'Chelstone',
                'Matero',
                'Chilenje',
              ].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Notes / portfolio links
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ minHeight: 100 }}
            />
          </label>
          <label className="field">
            ID / NRC / portfolio photos
            <input type="file" accept="image/*" multiple onChange={onFiles} />
          </label>
          {uploading ? <p className="muted" style={{ margin: 0 }}>Uploading…</p> : null}
          {documentUrls.length > 0 ? (
            <ul className="muted" style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {documentUrls.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {url.split('/').pop()}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="submit" className="btn-primary" disabled={uploading}>
            {application?.status === 'NEEDS_INFO' ? 'Resubmit for review' : 'Submit for review'}
          </button>
        </form>
      ) : null}

      {step === 'status' && application ? (
        <div className="panel" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Application status</h2>
          <p>
            <strong>{application.displayName}</strong>{' '}
            <span className="badge badge-warn">{application.status}</span>
          </p>
          {application.adminNote ? (
            <p className="muted">Admin note: {application.adminNote}</p>
          ) : null}
          {application.status === 'APPROVED' ? (
            <p className="muted">
              Download <strong>ZANA Pro</strong>, complete shop setup, buy a float, and go online.
            </p>
          ) : null}
          {application.status === 'PENDING' ? (
            <p className="muted">
              Our team is reviewing your docs. We&apos;ll message you on WhatsApp/SMS.
            </p>
          ) : null}
          {application.status === 'REJECTED' ? (
            <p className="error">
              This application was rejected. Contact support if you think this is a mistake.
            </p>
          ) : null}
          {application.status === 'NEEDS_INFO' ? (
            <button type="button" className="btn-primary" onClick={() => setStep('form')}>
              Update and resubmit
            </button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
