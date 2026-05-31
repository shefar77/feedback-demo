'use client';

import { useState } from 'react';
import { RATING_LABELS, TONE_INFO } from '../lib/constants';

interface Props {
  rating: number;
  setRating: (r: number) => void;
  onNext: () => void;
}

const TONE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  neutral:  { bg: '#f5f5f4', text: '#57534e', border: '#e7e5e4' },
  positive: { bg: '#fefce8', text: '#a16207', border: '#fde68a' },
};

export default function StepRating({ rating, setRating, onNext }: Props) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || rating;
  const tone   = rating ? TONE_INFO[rating] : null;
  const colors = tone ? TONE_COLORS[tone.cls] : null;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

      {/* Header */}
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 300, letterSpacing: '-0.03em', color: '#1a1714', lineHeight: 1.2, marginBottom: '8px' }}>
          How was your experience?
        </h2>
        <p style={{ fontSize: '13px', color: '#a8a098' }}>
          Tap a star and we'll craft the perfect review for you
        </p>
      </div>

      {/* Star visual */}
      <div style={{ margin: '32px 0 12px', position: 'relative' }}>
        {/* Glow behind stars when selected */}
        {active > 0 && (
          <div style={{
            position: 'absolute', inset: '-20px',
            background: `radial-gradient(ellipse, ${active >= 4 ? 'rgba(196,154,42,0.12)' : active === 3 ? 'rgba(100,100,100,0.08)' : 'rgba(200,68,26,0.1)'} 0%, transparent 70%)`,
            borderRadius: '50%', pointerEvents: 'none',
          }} />
        )}
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          {[1, 2, 3, 4, 5].map((i) => {
            const filled = i <= active;
            return (
              <button
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                  transform: filled ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  outline: 'none',
                }}
              >
                <svg viewBox="0 0 24 24" style={{
                  width: '42px', height: '42px',
                  fill: filled ? '#c49a2a' : '#e8e3db',
                  filter: filled ? 'drop-shadow(0 2px 4px rgba(196,154,42,0.4))' : 'none',
                  transition: 'all 0.18s ease',
                }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating label */}
      <div style={{ height: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        {rating > 0 && (
          <span style={{
            fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300,
            color: '#1a1714', letterSpacing: '-0.02em',
          }}>
            {RATING_LABELS[rating]}
          </span>
        )}
      </div>

      {/* Tone pill */}
      <div style={{ height: '32px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
        {tone && colors && (
          <>
          </>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        disabled={!rating}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          background: rating ? '#c8441a' : '#e8e3db',
          color: rating ? 'white' : '#b0a898',
          border: 'none', padding: '13px 32px', borderRadius: '14px',
          fontSize: '14px', fontWeight: 500, cursor: rating ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          boxShadow: rating ? '0 4px 16px rgba(200,68,26,0.3)' : 'none',
          transform: 'translateY(0)',
        }}
        onMouseEnter={e => { if (rating) { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; (e.target as HTMLElement).style.boxShadow = '0 8px 24px rgba(200,68,26,0.4)'; } }}
        onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; (e.target as HTMLElement).style.boxShadow = rating ? '0 4px 16px rgba(200,68,26,0.3)' : 'none'; }}
      >
        Get my review suggestions
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}