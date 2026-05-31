'use client';

import { useState } from 'react';
import { RATING_LABELS, TONE_INFO } from '../lib/constants';

interface Props {
  rating: number;
  editedText: string;
  setEditedText: (t: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const QUICK_APPENDS = [
  { label: '+ Staff', text: ' The staff were incredibly helpful.' },
  { label: '+ Food', text: ' The food was delicious.' },
  { label: '+ Ambience', text: ' The ambience was lovely.' },
  { label: '+ Will return', text: ' I will definitely be back!' },
];

export default function StepEdit({ rating, editedText, setEditedText, onBack, onSubmit }: Props) {
  const [focused, setFocused] = useState(false);
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const tone  = TONE_INFO[rating];
  const pct   = Math.min((editedText.length / 1000) * 100, 100);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, letterSpacing: '-0.02em', color: '#1a1714', marginBottom: '4px' }}>
          Make it yours
        </h2>
        <p style={{ fontSize: '12px', color: '#a8a098' }}>Edit freely. This should sound like you.</p>
      </div>

      {/* Rating badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: '8px 14px', borderRadius: '10px', marginBottom: '16px',
        background: '#fefce8', border: '1px solid #fde68a',
      }}>
        <span style={{ color: '#c49a2a', fontSize: '14px', letterSpacing: '2px' }}>{stars}</span>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#92400e' }}>
          {RATING_LABELS[rating]}
        </span>
      </div>

      {/* Textarea with live border */}
      <div style={{
        border: focused ? '1.5px solid rgba(200,68,26,0.5)' : '1.5px solid rgba(0,0,0,0.1)',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: focused ? '0 0 0 3px rgba(200,68,26,0.08)' : 'none',
        transition: 'all 0.2s ease', marginBottom: '12px',
        background: focused ? '#fff' : '#faf9f7',
      }}>
        <textarea
          value={editedText}
          onChange={e => setEditedText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={1000}
          rows={5}
          placeholder="Your review will appear here…"
          style={{
            width: '100%', padding: '16px', border: 'none', outline: 'none',
            fontSize: '13.5px', lineHeight: 1.7, color: '#1a1714',
            background: 'transparent', resize: 'none', fontFamily: 'DM Sans, sans-serif',
          }}
        />
        {/* Progress bar */}
        <div style={{ height: '3px', background: '#f0ede8' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct > 80 ? '#c8441a' : '#c49a2a',
            transition: 'width 0.2s ease, background 0.3s ease',
          }} />
        </div>
      </div>

      {/* Char count + quick appends */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {QUICK_APPENDS.map(({ label, text }) => (
            <button key={label} onClick={() => setEditedText((editedText + text).trim())}
              style={{
                fontSize: '11px', fontWeight: 500, padding: '5px 11px', borderRadius: '99px',
                border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#6b6456',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f0ede8'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '11px', color: editedText.length > 800 ? '#c8441a' : '#a8a098' }}>
          {editedText.length}/1000
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <button onClick={onBack} style={{
          fontSize: '13px', color: '#6b6456', padding: '10px 18px',
          borderRadius: '12px', border: '1px solid rgba(0,0,0,0.09)',
          background: 'transparent', cursor: 'pointer',
        }}>
          ← Back
        </button>
        <button onClick={onSubmit} disabled={!editedText.trim()} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: editedText.trim() ? '#c8441a' : '#e8e3db',
          color: editedText.trim() ? 'white' : '#b0a898',
          border: 'none', padding: '10px 22px', borderRadius: '12px',
          fontSize: '13px', fontWeight: 500,
          cursor: editedText.trim() ? 'pointer' : 'not-allowed',
          boxShadow: editedText.trim() ? '0 4px 12px rgba(200,68,26,0.25)' : 'none',
          transition: 'all 0.2s ease',
        }}>
          Submit review
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}