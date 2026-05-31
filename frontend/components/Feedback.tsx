'use client';

import { useState, useEffect } from 'react';
import type { FeedbackContext, Suggestion, Step } from '../lib/types';
import { generateFeedback, submitFeedback, buildGoogleReviewUrl } from '../lib/api';
import StepIndicator from './StepIndicator';
import StepRating from './StepRating';
import StepSuggestions from './StepSuggestions';
import StepEdit from './StepEdit';
import StepGoogle from './StepGoogle';

interface Props { context: FeedbackContext; }

export default function FeedbackFlow({ context }: Props) {
  const [step, setStep]               = useState<Step>(1);
  const [rating, setRating]           = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [editedText, setEditedText]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleUrl, setGoogleUrl]     = useState('');
  const [error, setError]             = useState('');
  const [mounted, setMounted]         = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleGenerateSuggestions() {
    setLoading(true); setError(''); setStep(2);
    try {
      const res = await generateFeedback({ rating, context });
      setSuggestions(res.suggestions);
    } catch {
      setError('Failed to generate suggestions. Please try again.');
      setSuggestions([]);
    } finally { setLoading(false); }
  }

  function handleSelectSuggestion(idx: number) {
    setSelectedIdx(idx);
    setEditedText(suggestions[idx]);
  }

  async function handleSubmit() {
    setError('');
    try {
      const res = await submitFeedback({
        rating, 
        context: {
          placeId: context.placeId,
          bizName: context.bizName,
          category: context.category,
          lang: context.lang
        },
        text: editedText,
      });
      setGoogleUrl(res.googleReviewUrl || buildGoogleReviewUrl(context.placeId));
      setStep(4);
    } catch { setError('Submission failed. Please try again.'); }
  }

  function handleReset() {
    setStep(1); setRating(0); setSuggestions([]); setSelectedIdx(-1);
    setEditedText(''); setGoogleUrl(''); setError('');
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center" style={{ background: '#0f0d0b' }}>

      {/* ── BACKGROUND ── */}

      {/* Warm charcoal base gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #141009 0%, #0f0d0b 50%, #130c08 100%)',
      }} />

      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Large amber glow — top left */}
      <div className="absolute" style={{
        top: '-20%', left: '-15%',
        width: '70vw', height: '70vw', maxWidth: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,68,26,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Terracotta glow — bottom right */}
      <div className="absolute" style={{
        bottom: '-20%', right: '-15%',
        width: '60vw', height: '60vw', maxWidth: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,154,42,0.1) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* ── FLOATING AMBIENT CARDS — left ── */}
      {mounted && (
        <div className="absolute left-4 top-0 bottom-0 hidden xl:flex flex-col justify-center gap-4 pointer-events-none" style={{ width: '220px' }}>
          {[
            { stars: 5, text: 'Absolutely exceptional. The team truly cares.', author: 'Priya M.', cls: 'float-a' },
            { stars: 4, text: 'Really great experience overall. Minor wait but completely worth it.', author: 'Rahul S.', cls: 'float-b'},
            { stars: 5, text: 'Consistently delivers an amazing experience.', author: 'Anjali K.', cls: 'float-c'},
          ].map((c, i) => (
            <div key={i} className={c.cls}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '16px',
                padding: '16px',
                backdropFilter: 'blur(20px)',
                transform: `rotate(${i % 2 === 0 ? '-1.5' : '1.2'}deg)`,
              }}>
              <div style={{ color: '#c49a2a', fontSize: '11px', marginBottom: '8px', letterSpacing: '3px' }}>
                {'★'.repeat(c.stars)}
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '10px' }}>
                "{c.text}"
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                {c.author}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── FLOATING AMBIENT CARDS — right ── */}
      {mounted && (
        <div className="absolute right-4 top-0 bottom-0 hidden xl:flex flex-col justify-center gap-4 pointer-events-none" style={{ width: '200px' }}>
          {[
            { label: 'Reviews collected', value: '2,841', sub: '↑ 18% this month', subColor: '#4ade80', cls: 'float-b', rot: '1deg' },
            { label: 'Avg rating', value: '4.6 ★', sub: 'across all locations', subColor: 'rgba(255,255,255,0.25)', cls: 'float-a', rot: '-0.8deg' },
          ].map((s, i) => (
            <div key={i} className={s.cls} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)',
              transform: `rotate(${s.rot})`,
            }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 600, color: i === 1 ? '#c49a2a' : 'rgba(255,255,255,0.88)', lineHeight: 1, marginBottom: '5px' }}>{s.value}</p>
              <p style={{ fontSize: '10px', color: s.subColor }}>{s.sub}</p>
            </div>
          ))}
          <div className="float-b" style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)',
          }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '12px' }}>Recent</p>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[{ name: 'Arjun T.', stars: 5, time: '2m ago' }, { name: 'Meera P.', stars: 4, time: '11m ago' }, { name: 'Karan V.', stars: 5, time: '34m ago' }].map((r, i) => (
                <div key={i}>
                  <p style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{r.name}</p>
                  <p style={{ color: '#c49a2a', fontSize: '9px', letterSpacing: '2px' }}>{'★'.repeat(r.stars)}</p>
                  <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)' }}>{r.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="relative z-10 w-full max-w-[520px] px-4 py-10">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#c8441a', boxShadow: '0 0 8px rgba(200,68,26,0.6)' }} />
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: 'rgba(255,255,255,0.85)', fontWeight: 300, letterSpacing: '-0.02em' }}>
              Feedback Portal
            </span>
          </div>
          <span style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            padding: '5px 13px', borderRadius: '99px', backdropFilter: 'blur(10px)',
          }}>
            {context.bizName}
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(252,250,248,0.98)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
          overflow: 'hidden',
        }}>
          <StepIndicator step={step} />
          {error && (
            <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '13px', color: '#dc2626' }}>
              {error}
              <button onClick={() => { setError(''); setStep(1); }} style={{ marginLeft: '8px', textDecoration: 'underline', cursor: 'pointer' }}>Start over</button>
            </div>
          )}
          <div style={{ padding: '32px', minHeight: '400px' }}>
            {step === 1 && <StepRating rating={rating} setRating={setRating} onNext={handleGenerateSuggestions} />}
            {step === 2 && <StepSuggestions rating={rating} suggestions={suggestions} selectedIdx={selectedIdx} loading={loading} onSelect={handleSelectSuggestion} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
            {step === 3 && <StepEdit rating={rating} editedText={editedText} setEditedText={setEditedText} onBack={() => setStep(2)} onSubmit={handleSubmit} />}
            {step === 4 && <StepGoogle rating={rating} finalText={editedText} googleUrl={googleUrl || buildGoogleReviewUrl(context.placeId)} onReset={handleReset} />}
          </div>
        </div>
      </div>
    </div>
  );
}