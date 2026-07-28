'use client';

import { FormEvent, useEffect, useState, type CSSProperties, type ChangeEvent } from 'react';
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
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/zana-mark.svg" alt="ZANA" width={40} height={40} />
        <div>
          <div
            className="brand-wordmark"
            style={{ fontWeight: 800, letterSpacing: '0.18em', fontSize: 18 }}
          >
            ZANA
          </div>
          <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500 }}>
            Style at your fingertips
          </div>
        </div>
      </div>
      <h1 style={{ marginTop: 18, fontSize: 32, lineHeight: 1.15 }}>Become a Professional</h1>
      <p style={{ color: 'var(--muted)' }}>
        Apply once. ZANA reviews your docs, then you download ZANA Pro and buy
        your first float.
      </p>

      {error ? (
        <p style={{ color: '#b91c1c', whiteSpace: 'pre-wrap' }}>{error}</p>
      ) : null}

      {step === 'otp' ? (
        <form onSubmit={verifyOtp} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          <label>
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <label>
            Phone (+260)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <button type="button" onClick={requestOtp} style={secondaryBtn}>
            Send OTP
          </button>
          <label>
            OTP code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={inputStyle}
              placeholder="123456 in dev"
              required
            />
          </label>
          <button type="submit" style={primaryBtn}>
            Continue
          </button>
        </form>
      ) : null}

      {step === 'form' ? (
        <form
          onSubmit={submitApplication}
          style={{ display: 'grid', gap: 12, marginTop: 24 }}
        >
          {application?.status === 'NEEDS_INFO' ? (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'var(--paper)',
                border: '1px solid var(--line)',
              }}
            >
              <strong>More info needed</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                {application.adminNote || 'Please update your application and resubmit.'}
              </p>
            </div>
          ) : null}
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={inputStyle}
            >
              <option value="INDEPENDENT">Independent (mobile)</option>
              <option value="SALON">Salon</option>
              <option value="BARBERSHOP">Barbershop</option>
            </select>
          </label>
          <label>
            Display name
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              style={inputStyle}
              required
            />
          </label>
          <label>
            Area (Lusaka)
            <select
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              style={inputStyle}
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
          <label>
            Notes / portfolio links
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: 100 }}
            />
          </label>
          <label>
            ID / NRC / portfolio photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFiles}
              style={{ ...inputStyle, padding: 8 }}
            />
          </label>
          {uploading ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Uploading…</p>
          ) : null}
          {documentUrls.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', fontSize: 13 }}>
              {documentUrls.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {url.split('/').pop()}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="submit" style={primaryBtn} disabled={uploading}>
            {application?.status === 'NEEDS_INFO' ? 'Resubmit for review' : 'Submit for review'}
          </button>
        </form>
      ) : null}

      {step === 'status' && application ? (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 12,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Application status</h2>
          <p>
            <strong>{application.displayName}</strong> · {application.status}
          </p>
          {application.adminNote ? (
            <p style={{ color: 'var(--muted)' }}>Admin note: {application.adminNote}</p>
          ) : null}
          {application.status === 'APPROVED' ? (
            <p style={{ color: 'var(--muted)' }}>
              Download <strong>ZANA Pro</strong>, complete shop setup, buy a float, and go online.
            </p>
          ) : null}
          {application.status === 'PENDING' ? (
            <p style={{ color: 'var(--muted)' }}>
              Our team is reviewing your docs. We&apos;ll message you on WhatsApp/SMS.
            </p>
          ) : null}
          {application.status === 'REJECTED' ? (
            <p style={{ color: '#b91c1c' }}>
              This application was rejected. Contact support if you think this is a mistake.
            </p>
          ) : null}
          {application.status === 'NEEDS_INFO' ? (
            <button type="button" style={primaryBtn} onClick={() => setStep('form')}>
              Update and resubmit
            </button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--paper)',
};

const primaryBtn: CSSProperties = {
  background: 'var(--charcoal)',
  color: '#fff',
  border: 0,
  borderRadius: 10,
  padding: '12px 16px',
  cursor: 'pointer',
};

const secondaryBtn: CSSProperties = {
  background: 'var(--paper)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '10px 16px',
  cursor: 'pointer',
};
