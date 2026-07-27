'use client';

import { FormEvent, useState, type CSSProperties, type ChangeEvent } from 'react';
import { api } from '@/lib/api';

type Step = 'otp' | 'form' | 'done';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1').replace(
  /\/v1\/?$/,
  '',
);

export default function ApplyPage() {
  const [step, setStep] = useState<Step>('otp');
  const [phone, setPhone] = useState('+260');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    type: 'INDEPENDENT',
    displayName: '',
    area: 'Roma',
    notes: '',
  });

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
        body: JSON.stringify({ phone, code }),
      });
      setToken(res.token);
      setStep('form');
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
      await api('/applications', {
        method: 'POST',
        token,
        body: JSON.stringify({ ...form, documentUrls }),
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
      <p style={{ letterSpacing: '0.2em', fontSize: 12, color: 'var(--gold)' }}>
        pro.zana.zm
      </p>
      <h1 style={{ marginTop: 8 }}>Become a Professional</h1>
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
            Submit for review
          </button>
        </form>
      ) : null}

      {step === 'done' ? (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 12,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Application received</h2>
          <p style={{ color: 'var(--muted)' }}>
            Our team will review and message you on WhatsApp/SMS. After approval,
            download <strong>ZANA Pro</strong>, buy a float, and go online.
          </p>
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
