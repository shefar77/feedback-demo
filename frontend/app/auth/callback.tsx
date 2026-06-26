'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken, setStoredUser } from '../../lib/auth';
import { Suspense } from 'react';

function CallbackHandler() {
  const router       = useRouter();
  const params       = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const token   = params.get('token');
    const userStr = params.get('user');
    const error   = params.get('error');

    if (error) {
      setMsg(error === 'google_cancelled' ? 'Sign-in cancelled.' : 'Google sign-in failed. Please try again.');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    if (!token || !userStr) {
      setMsg('Something went wrong.');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setToken(token);
      setStoredUser(user);
      setMsg(`Welcome${params.get('newUser') === 'true' ? '! Account created' : ' back'}, ${user.name}!`);
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch {
      setMsg('Something went wrong.');
      setTimeout(() => router.push('/login'), 2000);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d0b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8441a', boxShadow: '0 0 10px rgba(200,68,26,0.7)' }} />
        <span style={{ fontFamily: 'Fraunces,serif', fontSize: '18px', color: 'rgba(255,255,255,0.88)', fontWeight: 300 }}>FeedbackFlow</span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#c8441a', animation: `pulse 1.3s ease-in-out ${i * 0.18}s infinite` }} />
        ))}
      </div>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans,sans-serif' }}>{msg}</p>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }`}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif', fontSize: '14px' }}>Loading…</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}