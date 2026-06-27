import axios from 'axios';

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';

const DEFAULT_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google-callback';

export function getGoogleAuthUrl(redirectUri?: string): string {
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  redirectUri ?? DEFAULT_REDIRECT_URI,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri?: string) {
  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id:     GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri:  redirectUri ?? DEFAULT_REDIRECT_URI,
    grant_type:    'authorization_code',
  });
  return data as { access_token: string; id_token: string; refresh_token?: string };
}

export async function getGoogleProfile(accessToken: string) {
  const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data as {
    id:             string;
    email:          string;
    name:           string;
    picture:        string;
    verified_email: boolean;
  };
}