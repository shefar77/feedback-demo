'use client';

import type { Step } from '../lib/types';

const STEPS = ['Rate', 'Suggestions', 'Edit', 'Post'];

export default function StepIndicator({ step }: { step: Step }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#f9f7f4',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      padding: '14px 24px',
      gap: '0',
    }}>
      {STEPS.map((label, i) => {
        const num    = i + 1;
        const done   = num < step;
        const active = num === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '22px', height: '22px', borderRadius: '50%',
                fontSize: '10px', fontWeight: 600, lineHeight: 1, flexShrink: 0,
                background: done ? '#10b981' : active ? '#c8441a' : 'rgba(0,0,0,0.08)',
                color: done || active ? 'white' : 'rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
                boxShadow: active ? '0 2px 8px rgba(200,68,26,0.35)' : 'none',
              }}>
                {done ? '✓' : num}
              </span>
              <span style={{
                fontSize: '12px', fontWeight: 500,
                color: done ? '#10b981' : active ? '#c8441a' : 'rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: '1px', margin: '0 8px',
                background: num < step ? '#10b981' : 'rgba(0,0,0,0.08)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}