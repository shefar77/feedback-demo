'use client';

import { useState } from 'react';

interface Props {
  rating: number;
  finalText: string;
  googleUrl: string;
  onReset: () => void;
}

type CopyState = 'idle' | 'copied' | 'failed';

export default function StepGoogle({ rating, finalText, googleUrl, onReset }: Props) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [redirecting, setRedirecting] = useState(false);
  const stars   = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const preview = finalText.length > 180 ? finalText.slice(0, 180) + '…' : finalText;

  async function handlePostOnGoogle() {
    try {
      await navigator.clipboard.writeText(finalText);
      setCopyState('copied');
    } 
    catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = finalText;
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        setCopyState(ok ? 'copied' : 'failed');
      } 
      catch { setCopyState('failed'); }
    }
    setTimeout(() => {
      window.open(googleUrl, '_blank', 'noopener,noreferrer');
      setRedirecting(false);
    }, 1200);
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
        border: '2px solid #6ee7b7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, letterSpacing: '-0.03em', color: '#1a1714', marginBottom: '8px' }}>
        Review Saved!
      </h2>
      <p className="text-[13px] text-[#a8a098] max-w-[320px] leading-relaxed mb-7">
        Your {rating}-star feedback has been recorded. Post it on Google to let others know.
      </p>

      {/* Preview */}
      <div className="w-full bg-[#faf9f7] border border-black/[0.07] rounded-2xl px-5 py-4 mb-6 text-left">
        <div className="text-[#c49a2a] text-sm mb-2 tracking-wider">{stars}</div>
        <p className="text-[13px] text-[#6b6456] leading-relaxed italic">"{preview}"</p>
      </div>

      {/* Instruction banner — changes based on copy state */}
      <div className={`
        w-full max-w-md mb-5 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center transition-all
        ${copyState === 'copied'  ? 'bg-green-50 text-green-700 border border-green-200' : ''}
        ${copyState === 'failed'  ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
        ${copyState === 'idle'    ? 'bg-blue-50 text-blue-700 border border-blue-200'    : ''}
      `}>
        {copyState === 'idle'   && <><span>📋</span> Your review will be copied to clipboard automatically</>}
        {copyState === 'copied' && <><span>✅</span> Copied! Just paste it in the Google review box and hit Post</>}
        {copyState === 'failed' && <><span>⚠️</span> Could not copy automatically — please copy the text above manually, then paste on Google</>}
      </div>

      {/* Google CTA button */}
      <button
        onClick={handlePostOnGoogle}
        disabled={redirecting}
        className="inline-flex items-center gap-3 bg-[#4285F4] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#2b6fe0] transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait mb-3 w-full max-w-md justify-center"
      >
        <span className="w-5 h-5 bg-white rounded flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.075 17.64 11.768 17.64 9.2z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
        </span>
        {redirecting ? 'Opening Google Reviews…' : 'Copy & Post on Google Reviews'}
      </button>

      <button onClick={onReset} style={{
        fontSize: '12px', color: '#b0a898', background: 'none', border: 'none',
        cursor: 'pointer', transition: 'color 0.15s',
      }}
        onMouseEnter={e => { (e.target as HTMLElement).style.color = '#6b6456'; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.color = '#b0a898'; }}
      >
        Submit another review
      </button>
    </div>
  );
}