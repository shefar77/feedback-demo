'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup, forgotPassword, resetPassword } from '../lib/auth';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Props { mode: Mode; resetToken?: string; }

export default function AuthForm({ mode, resetToken }: Props) {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const S: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', background: '#0f0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
    card:    { background: 'rgba(252,250,248,0.98)', borderRadius: '24px', padding: 'clamp(28px,5vw,44px)', width: '100%', maxWidth: '420px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' },
    logo:    { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
    dot:     { width: '8px', height: '8px', borderRadius: '50%', background: '#c8441a', boxShadow: '0 0 8px rgba(200,68,26,0.6)' },
    title:   { fontFamily: 'Fraunces,serif', fontSize: '24px', fontWeight: 300, color: '#1a1714', letterSpacing: '-0.03em', marginBottom: '6px' },
    sub:     { fontSize: '13px', color: '#a8a098', marginBottom: '28px' },
    label:   { display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6b6456', marginBottom: '6px' },
    input:   { width: '100%', padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', color: '#1a1714', background: '#faf9f7', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' as const },
    btn:     { width: '100%', padding: '13px', background: '#c8441a', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 16px rgba(200,68,26,0.3)', transition: 'all 0.2s', marginBottom: '16px' },
    link:    { color: '#c8441a', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', fontWeight: 500 },
    error:   { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', marginBottom: '16px' },
    success: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#16a34a', marginBottom: '16px' },
    divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 16px', color: '#a8a098', fontSize: '12px' },
    line:    { flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' },
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        router.push('/dashboard');
      } else if (mode === 'signup') {
        if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return; }
        await signup(name, email, password);
        router.push('/dashboard');
      } else if (mode === 'forgot') {
        const res = await forgotPassword(email);
        setSuccess(res.message ?? 'Reset link sent. Check your email.');
      } else if (mode === 'reset' && resetToken) {
        if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return; }
        await resetPassword(resetToken, password);
        setSuccess('Password reset! Redirecting to login…');
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  }

  const titles: Record<Mode, string> = { login: 'Welcome back', signup: 'Create your account', forgot: 'Reset your password', reset: 'Set new password' };
  const subs:   Record<Mode, string> = { login: 'Sign in to earn points and track your reviews', signup: 'Join Feedback Portal and start earning rewards', forgot: 'We\'ll send you a reset link', reset: 'Choose a strong new password' };

  return (
    <div style={S.page}>
      {/* BG glows */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,68,26,0.12) 0%,transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,154,42,0.1) 0%,transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        <div style={S.card}>
          <div style={S.logo}>
            <div style={S.dot} />
            <span style={{ fontFamily: 'Fraunces,serif', fontSize: '16px', color: '#1a1714', fontWeight: 300 }}>Feedback Portal</span>
          </div>

          <h1 style={S.title}>{titles[mode]}</h1>
          <p style={S.sub}>{subs[mode]}</p>

          {error   && <div style={S.error}>{error}</div>}
          {success && <div style={S.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div>
                <label style={S.label}>Full name</label>
                <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </div>
            )}
            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div>
                <label style={S.label}>Email address</label>
                <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
            )}
            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div>
                <label style={S.label}>{mode === 'reset' ? 'New password' : 'Password'}</label>
                <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
            )}
            {(mode === 'signup' || mode === 'reset') && (
              <div>
                <label style={S.label}>Confirm password</label>
                <input style={S.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Reset password'}
            </button>
          </form>

          {/* Google Auth*/}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div style={S.divider}><div style={S.line}/><span>or</span><div style={S.line}/></div>
              <a
                href={`${API_URL}/auth/google?redirect_uri=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + 'api/auth/google-callback' : '')}`}                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  width: '100%', padding: '12px', borderRadius: '14px',
                  border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff',
                  fontSize: '14px', fontWeight: 500, color: '#3c4043',
                  textDecoration: 'none', cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                  marginBottom: '16px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.14)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.12)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.075 17.64 11.768 17.64 9.2z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </a>
            </>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#6b6456' }}>Don't have an account? <a style={S.link} onClick={() => router.push('/signup')}>Sign up</a></span>
              <a style={S.link} onClick={() => router.push('/forgot-password')}>Forgot password?</a>
            </div>
          )}
          {mode === 'signup' && (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#6b6456' }}>Already have an account? <a style={S.link} onClick={() => router.push('/login')}>Sign in</a></span>
            </div>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <div style={{ textAlign: 'center' }}>
              <a style={S.link} onClick={() => router.push('/login')}>← Back to sign in</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}