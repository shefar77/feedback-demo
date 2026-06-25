import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ff_token');
}

export function setToken(token: string) {
  localStorage.setItem('ff_token', token);
}

export function clearToken() {
  localStorage.removeItem('ff_token');
  localStorage.removeItem('ff_user');
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('ff_user') ?? 'null'); } catch { return null; }
}

export function setStoredUser(user: any) {
  localStorage.setItem('ff_user', JSON.stringify(user));
}

export const authApi = axios.create({ baseURL: API, timeout: 15000 });

authApi.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function signup(name: string, email: string, password: string, referralCode?: string) {
  const { data } = await authApi.post('/auth/signup', { name, email, password, referralCode });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await authApi.post('/auth/login', { email, password });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function logout() {
  try { await authApi.post('/auth/logout'); } catch {}
  clearToken();
}

export async function getMe() {
  const { data } = await authApi.get('/auth/me');
  setStoredUser(data);
  return data;
}

export async function updateProfile(updates: { name?: string; bio?: string; avatarUrl?: string }) {
  const { data } = await authApi.patch('/auth/profile', updates);
  setStoredUser(data);
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await authApi.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await authApi.post('/auth/reset-password', { token, password });
  return data;
}

export async function fetchDashboard() {
  const { data } = await authApi.get('/dashboard');
  return data;
}