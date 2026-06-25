'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthForm from '../../components/AuthForm';
function ResetForm() {
  const params = useSearchParams();
  return <AuthForm mode="reset" resetToken={params.get('token') ?? ''} />;
}
export default function Page() {
  return <Suspense fallback={null}><ResetForm /></Suspense>;
}