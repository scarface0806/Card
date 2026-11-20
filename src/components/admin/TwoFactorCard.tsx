'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Copy, Download, ShieldCheck } from 'lucide-react';

/**
 * Two-Factor Authentication card on /admin/security.
 *
 * Enrolment: Enable -> scan the QR (or type the key) -> confirm a 6-digit
 * code -> the 10 backup codes are shown ONCE, with a download and a
 * required "I have saved these codes" tick before they disappear. They are
 * never fetched again: the server keeps only bcrypt hashes.
 *
 * When enabled: backup codes can be regenerated, and 2FA can be disabled -
 * each through its own inline form needing the password AND a current
 * authenticator code or an unused backup code. A failed disable keeps the
 * form open with what was typed, so a typo can be corrected.
 *
 * Styling reuses the classes the password card on this page already uses
 * (graphite card, tv-adm-panel-title, the slate input, the brass button);
 * nothing new is introduced. Secrets and codes live only in component state
 * and are never written to storage or the console.
 */

const INPUT_CLASS =
  'w-full px-4 py-2.5 bg-[var(--tv-slate)] border border-[var(--tv-rule)] rounded-xl text-[var(--tv-text)] placeholder-[rgba(169,181,176,0.7)] focus:outline-none focus:border-[rgba(76,174,137,0.50)] focus:ring-1 focus:ring-[rgba(76,174,137,0.35)] transition-all';
const PRIMARY_BUTTON =
  'min-h-[44px] px-6 py-2.5 bg-[var(--tv-brass)] text-[var(--tv-ink)] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
const SECONDARY_BUTTON =
  'min-h-[44px] px-5 py-2.5 border border-[var(--tv-rule)] text-[var(--tv-text)] rounded-xl font-medium hover:border-[rgba(76,174,137,0.50)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

type Enrolment = { otpauthUrl: string; secretPreview: string };

async function postJson(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

function messageFrom(payload: { message?: string; error?: string }, fallback: string) {
  return payload?.message || payload?.error || fallback;
}

export default function TwoFactorCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Backup codes, shown once after confirm or regenerate.
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  const [regenOpen, setRegenOpen] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');
  const [regenCode, setRegenCode] = useState('');

  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const closeDisable = () => {
    setDisableOpen(false);
    setDisablePassword('');
    setDisableCode('');
  };

  const disableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { ok, payload } = await postJson('/api/admin/security/2fa/disable', {
        password: disablePassword,
        code: disableCode,
      });
      if (!ok) {
        // Keep the form open and the inputs as typed, so a typo can be fixed.
        setError(messageFrom(payload, 'Could not disable 2FA.'));
        return;
      }
      closeDisable();
      setRegenOpen(false);
      setEnrolment(null);
      setEnabled(false);
      setNotice(messageFrom(payload, '2FA disabled'));
    } catch {
      setError('Could not disable 2FA.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/security/2fa/status', { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setLoadError(messageFrom(payload, 'Could not load 2FA status.'));
          return;
        }
        setEnabled(payload.enabled === true);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load 2FA status.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startEnrolment = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { ok, payload } = await postJson('/api/admin/security/2fa/start');
      if (!ok) {
        setError(messageFrom(payload, 'Could not start 2FA setup.'));
        if (payload?.enabled === true) setEnabled(true);
        return;
      }
      setEnrolment({ otpauthUrl: payload.otpauthUrl, secretPreview: payload.secretPreview });
      setCode('');
    } catch {
      setError('Could not start 2FA setup.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrolment = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ok, payload } = await postJson('/api/admin/security/2fa/confirm', { code });
      if (!ok) {
        setError(messageFrom(payload, 'Invalid code'));
        return;
      }
      setEnrolment(null);
      setCode('');
      setSavedTick(false);
      setBackupCodes(payload.backupCodes as string[]);
    } catch {
      setError('Could not confirm the code.');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ok, payload } = await postJson('/api/admin/security/2fa/backup-codes/regenerate', {
        password: regenPassword,
        code: regenCode,
      });
      if (!ok) {
        setError(messageFrom(payload, 'Invalid password or code'));
        return;
      }
      setRegenOpen(false);
      setRegenPassword('');
      setRegenCode('');
      setSavedTick(false);
      setBackupCodes(payload.backupCodes as string[]);
    } catch {
      setError('Could not regenerate backup codes.');
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!enrolment) return;
    try {
      await navigator.clipboard.writeText(enrolment.secretPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadCodes = () => {
    if (!backupCodes) return;
    const text = [
      'Tapvyo admin - 2FA backup codes',
      'Each code works once. Keep them somewhere safe and offline.',
      '',
      ...backupCodes,
      '',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tapvyo-2fa-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const finishCodes = () => {
    // Codes leave the page for good; the server only has their hashes.
    setBackupCodes(null);
    setSavedTick(false);
    setEnabled(true);
  };

  return (
    <section className="bg-[var(--tv-graphite)] rounded-2xl border border-[var(--tv-rule)] p-4 sm:p-6 lg:p-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="tv-adm-panel-title flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[var(--tv-patina)] rounded-full"></span>
          Two-Factor Authentication
        </h2>
        {enabled === true && !backupCodes && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--tv-patina)] border border-[rgba(76,174,137,0.40)] bg-[rgba(76,174,137,0.10)] rounded-full px-3 py-1">
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Enabled
          </span>
        )}
      </div>

      <p className="text-sm text-[var(--tv-text-muted)] mb-6">
        While 2FA is on, signing in to the admin needs your password and a code from
        your authenticator app (or a backup code).
      </p>

      <div aria-live="polite">
        {notice && <p className="text-sm text-[var(--tv-patina)] mb-4">{notice}</p>}
        {loadError && <p className="text-sm text-[var(--tv-danger)] mb-4">{loadError}</p>}
        {error && <p role="alert" className="text-sm text-[var(--tv-danger)] mb-4">{error}</p>}
      </div>

      {enabled === null && !loadError && (
        <p className="text-sm text-[var(--tv-text-muted)]">Loading…</p>
      )}

      {/* BACKUP CODES - shown once, after confirm or regenerate. */}
      {backupCodes && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--tv-text)]">
            Save these backup codes now. Each works once if you lose your authenticator.
            <strong> They will not be shown again.</strong>
          </p>
          <ul className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-slate)] p-4 font-mono text-sm text-[var(--tv-text)]">
            {backupCodes.map((backupCode) => (
              <li key={backupCode} className="tracking-widest">{backupCode}</li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={downloadCodes} className={SECONDARY_BUTTON}>
              <span className="inline-flex items-center gap-2">
                <Download className="w-4 h-4" aria-hidden="true" />
                Download .txt
              </span>
            </button>
          </div>
          <label className="flex min-h-[44px] items-center gap-3 text-sm text-[var(--tv-text)] cursor-pointer">
            <input
              type="checkbox"
              checked={savedTick}
              onChange={(e) => setSavedTick(e.target.checked)}
              className="h-4 w-4 accent-[#C9A961]"
            />
            I have saved these codes
          </label>
          <button type="button" onClick={finishCodes} disabled={!savedTick} className={PRIMARY_BUTTON}>
            Done
          </button>
        </div>
      )}

      {/* STATE A - 2FA off. */}
      {enabled === false && !backupCodes && (
        <div className="space-y-6">
          {!enrolment ? (
            <button type="button" onClick={startEnrolment} disabled={busy} className={PRIMARY_BUTTON}>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                {busy ? 'Starting…' : 'Enable 2FA'}
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
              {/* Dark-on-white for reliable scanning on any theme. */}
              <div className="rounded-xl bg-white p-3 w-fit">
                <QRCodeSVG value={enrolment.otpauthUrl} size={200} level="M" />
              </div>
              <div className="space-y-4 min-w-0">
                <p className="text-sm text-[var(--tv-text)]">
                  Scan the code with Google Authenticator or a similar app, then enter the
                  6-digit code it shows.
                </p>
                <div>
                  <p className="tv-adm-field-label mb-1.5">Can&apos;t scan? Enter this key</p>
                  <div className="flex items-center gap-2">
                    <code className="block min-w-0 break-all rounded-lg bg-[var(--tv-slate)] border border-[var(--tv-rule)] px-3 py-2 font-mono text-sm text-[var(--tv-text)]">
                      {enrolment.secretPreview}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className={`${SECONDARY_BUTTON} shrink-0`}
                      aria-label="Copy setup key"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        {copied ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <form onSubmit={confirmEnrolment} className="space-y-3">
                  <label htmlFor="twofa-code" className="tv-adm-field-label">
                    6-digit code
                  </label>
                  <input
                    id="twofa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    disabled={busy}
                    className={`${INPUT_CLASS} max-w-[12rem] tracking-[0.3em] font-mono`}
                    required
                  />
                  <div>
                    <button type="submit" disabled={busy || code.length !== 6} className={PRIMARY_BUTTON}>
                      {busy ? 'Checking…' : 'Confirm'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE B - 2FA on. */}
      {enabled === true && !backupCodes && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setRegenOpen((open) => !open);
                setError(null);
              }}
              disabled={busy}
              className={SECONDARY_BUTTON}
              aria-expanded={regenOpen}
            >
              Regenerate backup codes
            </button>
            <button
              type="button"
              onClick={() => {
                if (disableOpen) closeDisable();
                else setDisableOpen(true);
                setError(null);
                setNotice(null);
              }}
              disabled={busy}
              className={SECONDARY_BUTTON}
              aria-expanded={disableOpen}
            >
              Disable 2FA
            </button>
          </div>

          {disableOpen && (
            <form onSubmit={disableTwoFactor} className="space-y-4 rounded-xl border border-[rgba(224,122,110,0.30)] p-4">
              <p className="text-sm text-[var(--tv-text)]">
                Turning 2FA off removes your authenticator setup and all backup codes. Sign-in
                will need only your password until you enable it again.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="disable-password" className="tv-adm-field-label">
                    Password
                  </label>
                  <input
                    id="disable-password"
                    type="password"
                    autoComplete="current-password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    disabled={busy}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="disable-code" className="tv-adm-field-label">
                    Authenticator or backup code
                  </label>
                  <input
                    id="disable-code"
                    autoComplete="one-time-code"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.trim().slice(0, 20))}
                    disabled={busy}
                    className={`${INPUT_CLASS} font-mono tracking-widest`}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={busy || !disablePassword || disableCode.length < 6}
                  className="min-h-[44px] px-6 py-2.5 bg-[var(--tv-danger)] text-[var(--tv-ink)] rounded-xl font-semibold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? 'Working…' : 'Disable 2FA'}
                </button>
                <button type="button" onClick={closeDisable} disabled={busy} className={SECONDARY_BUTTON}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {regenOpen && (
            <form onSubmit={regenerate} className="space-y-4 rounded-xl border border-[var(--tv-rule)] p-4">
              <p className="text-sm text-[var(--tv-text-muted)]">
                Your current backup codes stop working as soon as new ones are created.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="regen-password" className="tv-adm-field-label">
                    Password
                  </label>
                  <input
                    id="regen-password"
                    type="password"
                    autoComplete="current-password"
                    value={regenPassword}
                    onChange={(e) => setRegenPassword(e.target.value)}
                    disabled={busy}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="regen-code" className="tv-adm-field-label">
                    Authenticator or backup code
                  </label>
                  <input
                    id="regen-code"
                    autoComplete="one-time-code"
                    value={regenCode}
                    onChange={(e) => setRegenCode(e.target.value.trim().slice(0, 20))}
                    disabled={busy}
                    className={`${INPUT_CLASS} font-mono tracking-widest`}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy || !regenPassword || regenCode.length < 6}
                className={PRIMARY_BUTTON}
              >
                {busy ? 'Working…' : 'Generate new codes'}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
