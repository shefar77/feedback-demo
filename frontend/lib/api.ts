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
  console.log('API RESPONSE:', JSON.stringify(data, null, 2));
  return data;
}

export async function submitFeedback(payload: SubmitRequest): Promise<SubmitResponse> {
  const { data } = await api.post<SubmitResponse>('/submit-feedback', payload);
  return data;
}

export function buildGoogleReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=ChIJK9ZfSh-6bTkRJUzXVIgzQTc`;
}