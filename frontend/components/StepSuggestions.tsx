'use client';

import { useState } from 'react';
import type { Suggestion } from '../lib/types';
import { TONE_INFO } from '../lib/constants';

interface Props {
  rating: number;
  suggestions: Suggestion[];
  selectedIdx: number;
  loading: boolean;
  onSelect: (i: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepSuggestions({ rating, suggestions, selectedIdx, loading, onSelect, onBack, onNext }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const toneLabel = TONE_INFO[rating]?.label ?? 'Generating';
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="fade-up">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, letterSpacing: '-0.02em', color: '#1a1714', lineHeight: 1.25, marginBottom: '4px' }}>
            {loading ? 'Crafting suggestions…' : hasSuggestions ? 'Pick your starting point' : 'Something went wrong'}
          </h2>
          <p style={{ fontSize: '12px', color: '#a8a098' }}>
            {loading ? 'We are crafting personalised reviews for you' : hasSuggestions ? 'Select any one. You can edit it in the next step' : 'Please go back and try again'}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px 0 20px' }}>
            <span className="pulse-dot" />
            <span className="pulse-dot" />
            <span className="pulse-dot" />
          </div>
          {[88, 74, 62].map((w, i) => (
            <div key={i} style={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '10px', background: '#faf9f7' }}>
              <div className="skeleton" style={{ height: '12px', width: `${w}%`, marginBottom: '10px' }} />
              <div className="skeleton" style={{ height: '12px', width: `${w - 14}%`, marginBottom: '10px' }} />
              <div className="skeleton" style={{ height: '12px', width: `${w - 24}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state — backend failed */}
      {!loading && !hasSuggestions && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <p style={{ fontSize: '14px', color: '#6b6456', marginBottom: '20px' }}>
            Could not load suggestions. Your backend may be offline or the AI quota is exceeded.
          </p>
          <button onClick={onBack} style={{
            background: '#c8441a', color: 'white', border: 'none',
            padding: '10px 24px', borderRadius: '12px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
          }}>
            ← Go back and retry
          </button>
        </div>
      )}

      {/* Suggestions list — FIXED: explicit text rendering */}
      {!loading && hasSuggestions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {suggestions.map((s, i) => {
            const isSelected = selectedIdx === i;
            const isHovered  = hoveredIdx === i;
            const text = typeof s === 'string' ? s : s.text;
            const tone = typeof s === 'string' ? '' : s.tone;

            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(-1)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  background: isSelected ? '#fdf0ec' : isHovered ? '#faf9f7' : '#f9f8f6',
                  borderRadius: '16px', padding: '18px 20px',
                  outline: isSelected ? '1.5px solid rgba(200,68,26,0.4)' : isHovered ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(0,0,0,0.07)',
                  boxShadow: isSelected ? '0 2px 12px rgba(200,68,26,0.12)' : isHovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transform: isSelected ? 'translateX(2px)' : 'translateX(0)',
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  {/* Radio circle */}
                  <div style={{
                    flexShrink: 0, width: '18px', height: '18px', marginTop: '2px',
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #c8441a' : '2px solid rgba(0,0,0,0.18)',
                    background: isSelected ? '#c8441a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 0 3px rgba(200,68,26,0.15)' : 'none',
                  }}>
                    {isSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Text — explicit rendering prevents empty boxes */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '13.5px', lineHeight: 1.7,
                      color: '#1a1714', margin: 0,
                      wordBreak: 'break-word',
                    }}>
                      {text}
                    </p>
                    {tone && (
                      <span style={{
                        display: 'inline-block', marginTop: '8px',
                        fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.07em', color: '#a8a098',
                      }}>
                        {tone}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && hasSuggestions && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <button onClick={onBack} style={{
            fontSize: '13px', color: '#6b6456', padding: '10px 18px',
            borderRadius: '12px', border: '1px solid rgba(0,0,0,0.09)',
            background: 'transparent', cursor: 'pointer',
            transition: 'background 0.15s',
          }}>
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={selectedIdx < 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: selectedIdx >= 0 ? '#c8441a' : '#e8e3db',
              color: selectedIdx >= 0 ? 'white' : '#b0a898',
              border: 'none', padding: '10px 22px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 500,
              cursor: selectedIdx >= 0 ? 'pointer' : 'not-allowed',
              boxShadow: selectedIdx >= 0 ? '0 4px 12px rgba(200,68,26,0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Use this
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}