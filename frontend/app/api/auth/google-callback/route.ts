import { NextRequest, NextResponse } from 'next/server';
 
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
 
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');
 
  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=google_cancelled', APP_URL));
  }
 
  try {
    const redirectUri = `${APP_URL}/api/auth/google-callback`;
 
    const res = await fetch(`${API_URL}/auth/google/exchange`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, redirectUri }),
    });
 
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Backend exchange failed:', res.status, err);
      return NextResponse.redirect(new URL('/login?error=google_failed', APP_URL));
    }
 
    const { token, user, isNewUser } = await res.json();
 
    const dest = new URL(isNewUser ? '/dashboard?welcome=1' : '/dashboard', APP_URL);
    const response = NextResponse.redirect(dest);
 
    const cookieOpts = {
      path:     '/',
      maxAge:   30 * 24 * 60 * 60,
      sameSite: 'lax' as const,
      secure:   process.env.NODE_ENV === 'production',
    };
 
    // Store token and user in cookies so client JS (lib/auth.ts) can pick them up
    response.cookies.set('ff_token', token, cookieOpts);
    response.cookies.set('ff_user',  JSON.stringify(user), cookieOpts);
 
    return response;
 
  } catch (err: any) {
    console.error('Google callback route error:', err?.message ?? err);
    return NextResponse.redirect(new URL('/login?error=google_failed', APP_URL));
  }
}