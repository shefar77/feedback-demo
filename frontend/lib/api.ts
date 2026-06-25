/// <reference types="node" />

import axios from 'axios';
import type { GenerateRequest, GenerateResponse, SubmitRequest, SubmitResponse } from './types';

console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function generateFeedback(payload: GenerateRequest): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>('/generate-feedback', payload);
  const suggestions = (data.suggestions ?? []).map((s: unknown) => {
    if(typeof s === 'string'){
      return { text: s, tone: 'General' };
    }
    if(typeof s === 'object' && s !== null && 'text' in s){
      return s as { text: string; tone: string };
    }
    return { text: String(s), tone: 'General' };
  });
  return { ...data, suggestions };
}

export async function submitFeedback(
  payload: SubmitRequest,
  token?: string,): Promise<SubmitResponse> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const { data } = await api.post<SubmitResponse>('/submit-feedback', payload, { headers });
  return data;
}

export function buildGoogleReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=ChIJK9ZfSh-6bTkRJUzXVIgzQTc`;
}