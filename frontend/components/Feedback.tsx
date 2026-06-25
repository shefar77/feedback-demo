'use client';

import { useState, useEffect, useRef } from 'react';
import type { FeedbackContext, Suggestion } from '../lib/types';
import { generateFeedback, submitFeedback, buildGoogleReviewUrl } from '../lib/api';
import { RATING_LABELS, TONE_INFO, RATING_TAGS } from '../lib/constants';
import { getToken, getStoredUser, logout } from '../lib/auth';
import { useRouter } from 'next/navigation';

interface Props { context: FeedbackContext; }

const TONE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  neutral:  { bg: '#f5f5f4', text: '#57534e', border: '#e7e5e4' },
  positive: { bg: '#fefce8', text: '#a16207', border: '#fde68a' },
};

const FALLBACK_POOL: Record<number, { text: string; tone: string }[]> = {
  1: [
    { text: 'Had a pretty disappointing experience overall. Several things did not go as expected.', tone: 'Critical' },
    { text: 'The service was very slow and the staff did not seem attentive. Felt disorganized throughout.', tone: 'Frustrated' },
    { text: 'Waited much longer than expected and got very little help. Quality was poor.', tone: 'Negative' },
    { text: 'Too many issues during the visit for it to be enjoyable. Major improvements needed.', tone: 'Dissatisfied' },
    { text: 'The overall experience was frustrating. Expectations were not met from start to finish.', tone: 'Critical' },
    { text: 'Service quality was poor and did not feel customer focused at all.', tone: 'Negative' },
    { text: 'The experience was underwhelming and needs significant improvement honestly.', tone: 'Frustrated' },
    { text: 'Staff did not seem attentive and the process felt quite unorganized.', tone: 'Disappointed' },
    { text: 'Faced multiple issues during the visit and they were not handled properly.', tone: 'Critical' },
    { text: 'Would appreciate major improvements in service and responsiveness going forward.', tone: 'Dissatisfied' },
  ],
  2: [
    { text: 'The experience was below expectations and could be improved in several areas.', tone: 'Honest' },
    { text: 'Service was a bit inconsistent and the overall process felt slightly disorganized.', tone: 'Disappointed' },
    { text: 'A few things went well but there were noticeable areas that needed more attention.', tone: 'Mixed' },
    { text: 'The place was fine but the overall experience felt a bit underwhelming.', tone: 'Measured' },
    { text: 'Customer handling could have been more attentive and efficient overall.', tone: 'Constructive' },
    { text: 'Communication could have been clearer throughout the experience.', tone: 'Honest' },
    { text: 'The service felt average at best and lacked consistency during my visit.', tone: 'Disappointed' },
    { text: 'Staff were polite but the experience did not feel very smooth or well organized.', tone: 'Mixed' },
    { text: 'Waiting time was longer than expected and it affected the overall experience.', tone: 'Measured' },
    { text: 'More attention to detail would greatly improve the customer experience here.', tone: 'Constructive' },
  ],
  3: [
    { text: 'The experience was decent overall with some room for improvement. Nothing bad.', tone: 'Neutral' },
    { text: 'Service was satisfactory but there were a few delays here and there.', tone: 'Balanced' },
    { text: 'Everything was alright though nothing particularly stood out during the visit.', tone: 'Fair' },
    { text: 'The place was comfortable and the service was acceptable. A bit more speed would help.', tone: 'Neutral' },
    { text: 'Not a bad experience but there is definitely scope for improvement still.', tone: 'Balanced' },
    { text: 'It was an average experience that met basic expectations, nothing more nothing less.', tone: 'Fair' },
    { text: 'Things were handled reasonably well throughout the visit overall.', tone: 'Neutral' },
    { text: 'A few improvements in service speed would make a noticeable difference.', tone: 'Constructive' },
    { text: 'Staff were helpful and the experience was fairly smooth for the most part.', tone: 'Balanced' },
    { text: 'The overall experience was fine but could be a bit more consistent.', tone: 'Fair' },
  ],
  4: [
    { text: 'Had a very good experience overall. Everything was managed well and staff were friendly.', tone: 'Positive' },
    { text: 'The service was quick and the overall process was smooth. Appreciated the professionalism.', tone: 'Warm' },
    { text: 'The experience was pleasant and exceeded most of my expectations. Happy with the visit.', tone: 'Happy' },
    { text: 'Had a positive experience and would happily visit again. Service was impressive.', tone: 'Satisfied' },
    { text: 'Overall very satisfied with the experience and service provided here.', tone: 'Positive' },
    { text: 'Staff were friendly and made the visit comfortable throughout. Really appreciated it.', tone: 'Warm' },
    { text: 'The team was helpful and responsive whenever needed. Good experience overall.', tone: 'Satisfied' },
    { text: 'Really appreciated the professionalism shown throughout my visit. Well done.', tone: 'Happy' },
    { text: 'Quality of service was impressive and reliable. Would recommend to others.', tone: 'Positive' },
    { text: 'Everything felt organized and the visit went smoothly from start to finish.', tone: 'Warm' },
  ],
  5: [
    { text: 'Excellent experience from start to finish. Everything was outstanding, could not ask for more.', tone: 'Glowing' },
    { text: 'The staff were extremely welcoming and attentive. Service was exceptional throughout.', tone: 'Stellar' },
    { text: 'Highly satisfied with everything. The attention to detail really stood out during the visit.', tone: 'Enthusiastic' },
    { text: 'Everything was handled perfectly and with great professionalism. One of the best visits I have had.', tone: 'Glowing' },
    { text: 'Absolutely loved the experience. The team went above and beyond from the very beginning.', tone: 'Exceptional' },
    { text: 'Service was exceptional and exceeded all expectations. Will definitely be coming back.', tone: 'Stellar' },
    { text: 'Could not have asked for a better experience. Highly satisfied with everything.', tone: 'Glowing' },
    { text: 'The entire experience was outstanding. Every single aspect was handled brilliantly.', tone: 'Enthusiastic' },
    { text: 'Truly exceptional service and quality. Left feeling very impressed and well taken care of.', tone: 'Exceptional' },
    { text: 'Brilliant experience overall. The staff were fantastic and everything went perfectly.', tone: 'Stellar' },
  ],
};
 
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const AMBIENT_REVIEWS = [
  { stars: 5, text: 'Exceptional quality every time. The team genuinely cares.', author: 'Priya M.' },
  { stars: 4, text: 'Really great experience. Will definitely recommend.', author: 'Rahul S.' },
  { stars: 5, text: 'Warm, welcoming and consistently excellent. A gem.', author: 'Anjali K.' },
];

const RECENT_ACTIVITY = [
  { name: 'Arjun T.', stars: 5, time: '2m ago' },
  { name: 'Meera P.', stars: 4, time: '11m ago' },
  { name: 'Karan V.', stars: 5, time: '34m ago' },
];

export default function FeedbackFlow({ context }: Props) {
  const router = useRouter();
  const [rating, setRating]           = useState(0);
  const [hovered, setHovered]         = useState(0);
  const [reviewText, setReviewText]   = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [loadingAI, setLoadingAI]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [editedText, setEditedText]   = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');
  const [focused, setFocused]         = useState(false);
  const [mounted, setMounted]         = useState(false);
  const reviewRef                     = useRef<HTMLTextAreaElement>(null);
  const [authUser, setAuthUser]       = useState<any>(null);
  const [toast, setToast]             = useState<{ msg: string; pts?: number; badges?: string[] } | null>(null);

  useEffect(() => { 
    setMounted(true);
    const u = getStoredUser();
    if (u){
      setAuthUser(u);
    } 
  }, []);

  const active     = hovered || rating;
  const tone       = rating ? TONE_INFO[rating] : null;
  const toneColors = tone ? TONE_COLORS[tone.cls] : null;
  const charPct    = Math.min((reviewText.length / 1000) * 100, 100);

  async function handleRatingSelect(r: number) {
    setRating(r); setSelectedIdx(-1); setSuggestions([]); setReviewText(''); setError('');
    setLoadingAI(true);
    try {
      const res = await generateFeedback({ rating: r, context });
      setSuggestions(res.suggestions ?? []);
    } catch {
      const pool = FALLBACK_POOL[r] ?? FALLBACK_POOL[3];
      setSuggestions(pickRandom(pool, 5));
      setError('Could not load suggestions — you can still write your own review below.');
    } finally { setLoadingAI(false); }
  }

  function handlePickSuggestion(idx: number) {
    setSelectedIdx(idx);
    const text = typeof suggestions[idx] === 'string'
      ? suggestions[idx] as unknown as string
      : suggestions[idx]?.text ?? '';
    setReviewText(text);
    setTimeout(() => reviewRef.current?.focus(), 50);
  }

  async function handleSubmit() {
    if (!rating || !reviewText.trim()) return;
    setSubmitting(true);
    const googleUrl = buildGoogleReviewUrl(context.placeId);
    const token = getToken();
    submitFeedback({
      rating, 
      context: {
        placeId: context.placeId, 
        bizName: context.bizName,
        category: context.category, 
        lang: context.lang,
      },
      text: editedText, 
    })
    .then(res => {
      if (res.pointsAwarded > 0) {
        setToast({ msg: 'Points earned!', pts: res.pointsAwarded, badges: res.newBadges });
        setTimeout(() => setToast(null), 4000);
      }
    })
    .catch(() => {});
    try { await navigator.clipboard.writeText(reviewText); } catch {}
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => { window.open(googleUrl, '_blank', 'noopener,noreferrer'); }, 800);
  }

  function handleReset() {
    setRating(0); setHovered(0); setReviewText('');
    setSuggestions([]); setSelectedIdx(-1);
    setSubmitted(false); setError('');
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; margin: 0; padding: 0; }
        .ff-page {
          min-height: 100vh;
          background: #0f0d0b;
          padding: 24px 16px 48px;
        }
        .ff-inner {
          max-width: 1400px;
          margin: 0 auto;
        }
        .ff-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-top: 32px;
        }
        .ff-side { display: none; }
        .ff-center { width: 100%; }

        @media (min-width: 900px) {
          .ff-page { padding: 32px 24px 64px; }
          .ff-grid {
            grid-template-columns: 220px 1fr 220px;
            gap: 24px;
            align-items: start;
          }
          .ff-side { display: flex; flex-direction: column; gap: 12px; }
        }
        @media (min-width: 1200px) {
          .ff-page { padding: 40px 40px 80px; }
          .ff-grid {
            grid-template-columns: 260px 1fr 260px;
            gap: 32px;
          }
        }
        .float-a { animation: floatA 7s ease-in-out infinite; }
        .float-b { animation: floatB 8.5s ease-in-out infinite; }
        @keyframes floatA {
          0%,100% { transform: translateY(-6px) rotate(-1deg); }
          50%     { transform: translateY(6px) rotate(-1deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(6px) rotate(0.8deg); }
          50%     { transform: translateY(-6px) rotate(0.8deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg,#ede9e3 25%,#e4e0d8 50%,#ede9e3 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.8s infinite;
          border-radius: 6px;
        }
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.4; transform:scale(0.75); }
        }
        .pulse-dot {
          width:7px; height:7px; border-radius:50%;
          background:#c8441a;
          animation:pulse 1.3s ease-in-out infinite;
          display:inline-block;
        }
        .pulse-dot:nth-child(2) { animation-delay:.18s; }
        .pulse-dot:nth-child(3) { animation-delay:.36s; }
        button { -webkit-tap-highlight-color: transparent; }
        textarea { font-size: 16px !important; }
        .quick-btn:hover { background: #f0ede8 !important; }
        .sug-btn:hover { outline: 1px solid rgba(0,0,0,0.12) !important; box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 8px 28px rgba(200,68,26,0.45) !important; }
      `}</style>

      <div className="ff-page">
        <div className="ff-inner">

           {toast && (
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: 'rgba(30,26,22,0.96)', border: '1px solid rgba(196,154,42,0.4)', borderRadius: '16px', padding: '14px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', minWidth: '220px', animation: 'fadeUp 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>⭐</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#c49a2a', margin: '0 0 2px' }}>+{toast.pts} points earned!</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{toast.msg}</p>
                  {toast.badges && toast.badges.length > 0 && (
                    <p style={{ fontSize: '11px', color: '#4ade80', margin: '4px 0 0' }}>🏅 New badge: {toast.badges.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8441a', boxShadow: '0 0 10px rgba(200,68,26,0.7)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,0.88)', fontWeight: 300, letterSpacing: '-0.02em' }}>
                Feedback Portal
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(10px,1.5vw,12px)', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 14px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                {context.bizName}
              </span>
              {authUser ? (
                <>
                  <button onClick={() => router.push('/dashboard')} style={{ fontSize: '12px', color: '#c49a2a', background: 'rgba(196,154,42,0.1)', border: '1px solid rgba(196,154,42,0.25)', padding: '5px 14px', borderRadius: '99px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ⭐ {authUser.points ?? 0} pts
                  </button>
                  <button onClick={async () => { await logout(); setAuthUser(null); }} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '99px', cursor: 'pointer' }}>
                    Sign out
                  </button>
                </>
              ) : (
                <button onClick={() => router.push('/login')} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '5px 14px', borderRadius: '99px', cursor: 'pointer' }}>
                  Sign in to earn points →
                </button>
              )}
            </div>
          </nav>

          {/* Hero */}
          <div style={{ textAlign: 'center', padding: 'clamp(20px,4vw,40px) 0 0' }}>
            <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(24px,4.5vw,48px)', fontWeight: 300, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '12px' }}>
              Share your experience<br />
              <em style={{ fontStyle: 'italic', color: 'rgba(196,154,42,0.9)' }}>with {context.bizName}</em>
            </h1>
          </div>

          {/* Grid */}
          <div className="ff-grid">

            {/* Left side */}
            <div className="ff-side">
              <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', marginBottom: '4px' }}>Recent reviews</p>
              {AMBIENT_REVIEWS.map((c, i) => (
                <div key={i} className={mounted ? (i % 2 === 0 ? 'float-a' : 'float-b') : ''} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)' }}>
                  <div style={{ color: '#c49a2a', fontSize: '11px', letterSpacing: '3px', marginBottom: '8px' }}>{'★'.repeat(c.stars)}</div>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, marginBottom: '10px' }}>"{c.text}"</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>{c.author}</p>
                </div>
              ))}
            </div>

            {/* Center wala */}
            <div className="ff-center fade-up">
              {submitted ? (
                <div style={{ background: 'rgba(252,250,248,0.98)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 32px 80px rgba(0,0,0,0.5),0 8px 24px rgba(0,0,0,0.3)', padding: 'clamp(28px,5vw,48px)', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '2px solid #6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(22px,4vw,30px)', fontWeight: 300, color: '#1a1714', marginBottom: '8px', letterSpacing: '-0.03em' }}>Opening Google Reviews…</h2>
                  <p style={{ fontSize: '14px', color: '#a8a098', marginBottom: '20px', lineHeight: 1.6 }}>Your review was copied. Post on google to let others know!</p>
                  <div style={{ background: '#f9f8f6', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', textAlign: 'left' }}>
                    <div style={{ color: '#c49a2a', fontSize: '13px', letterSpacing: '3px', marginBottom: '8px' }}>{'★'.repeat(rating)}</div>
                    <p style={{ fontSize: '13px', color: '#6b6456', lineHeight: 1.7, fontStyle: 'italic' }}>"{reviewText.slice(0, 180)}{reviewText.length > 180 ? '…' : ''}"</p>
                  </div>
                  <button onClick={handleReset} style={{ fontSize: '13px', color: '#6b6456', background: 'none', border: '1px solid rgba(0,0,0,0.1)', padding: '8px 20px', borderRadius: '99px', cursor: 'pointer' }}>Submit another review</button>
                </div>
              ) : (
                <div style={{ background: 'rgba(252,250,248,0.98)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 32px 80px rgba(0,0,0,0.5),0 8px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.8)', overflow: 'hidden' }}>

                  {/* Progress */}
                  <div style={{ height: '3px', background: '#f0ede8' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#c8441a,#e06030)', transition: 'width 0.5s ease', width: rating === 0 ? '5%' : !reviewText.trim() ? '55%' : '100%' }} />
                  </div>

                  <div style={{ padding: 'clamp(24px,4vw,40px)' }}>

                    {/* Stars */}
                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#a8a098', marginBottom: '20px' }}>
                        How would you rate us?
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(6px,2vw,14px)', marginBottom: '16px' }}>
                        {[1,2,3,4,5].map(i => (
                          <button key={i}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => handleRatingSelect(i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'clamp(4px,1vw,8px)', transform: i <= active ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', outline: 'none' }}
                          >
                            <svg viewBox="0 0 24 24" style={{ width: 'clamp(36px,7vw,52px)', height: 'clamp(36px,7vw,52px)', fill: i <= active ? '#c49a2a' : '#e8e3db', filter: i <= active ? 'drop-shadow(0 3px 8px rgba(196,154,42,0.55))' : 'none', transition: 'all 0.2s ease', display: 'block' }}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <div className="fade-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 300, color: '#1a1714', letterSpacing: '-0.02em' }}>{RATING_LABELS[rating]}</span>
                        </div>
                      )}
                    </div>

                    {/* Suggestions */}
                    {rating > 0 && (
                      <>
                        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '28px' }} />
                        <div className="fade-up" style={{ marginBottom: '28px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#a8a098', marginBottom: '14px' }}>
                            Select any one that matches your experience.
                          </p>
                          {loadingAI ? (
                            <div>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
                                <span className="pulse-dot"/><span className="pulse-dot"/><span className="pulse-dot"/>
                              </div>
                              {[90,76,62].map((w,i) => (
                                <div key={i} style={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '18px', marginBottom: '10px', background: '#faf9f7' }}>
                                  <div className="skeleton" style={{ height: '12px', width: `${w}%`, marginBottom: '10px' }}/>
                                  <div className="skeleton" style={{ height: '12px', width: `${w-18}%` }}/>
                                </div>
                              ))}
                            </div>
                          ) : suggestions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {suggestions.map((s, i) => {
                                const text = s.text;
                                const st   = s.tone;
                                const isSel = selectedIdx === i;
                                return (
                                  <button key={i} className="sug-btn" onClick={() => handlePickSuggestion(i)} style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: isSel ? '#fdf0ec' : '#f9f8f6', borderRadius: '16px', padding: 'clamp(14px,2.5vw,20px)', outline: isSel ? '2px solid rgba(200,68,26,0.4)' : '1px solid rgba(0,0,0,0.07)', boxShadow: isSel ? '0 4px 16px rgba(200,68,26,0.14)' : 'none', transition: 'all 0.2s ease' }}>
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                      <div style={{ flexShrink: 0, width: '20px', height: '20px', marginTop: '2px', borderRadius: '50%', border: isSel ? '2px solid #c8441a' : '2px solid rgba(0,0,0,0.2)', background: isSel ? '#c8441a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: isSel ? '0 0 0 3px rgba(200,68,26,0.15)' : 'none' }}>
                                        {isSel && <svg width="9" height="7" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 'clamp(13px,2vw,14.5px)', lineHeight: 1.72, color: '#1a1714', margin: 0, wordBreak: 'break-word' }}>
                                          {text}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : error ? (
                            <p style={{ fontSize: '12px', color: '#d97706', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>{error}</p>
                          ) : null}
                        </div>
                      </>
                    )}

                    {/* Textarea */}
                    {rating > 0 && (
                      <>
                        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '28px' }} />
                        <div className="fade-up" style={{ marginBottom: '28px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#a8a098', marginBottom: '14px' }}>
                            Edit review
                          </p>
                          <div style={{ border: focused ? '1.5px solid rgba(200,68,26,0.5)' : '1.5px solid rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden', boxShadow: focused ? '0 0 0 4px rgba(200,68,26,0.08)' : 'none', transition: 'all 0.2s ease', background: focused ? '#fff' : '#faf9f7' }}>
                            <textarea
                              ref={reviewRef}
                              value={reviewText}
                              onChange={e => setReviewText(e.target.value)}
                              onFocus={() => setFocused(true)}
                              onBlur={() => setFocused(false)}
                              maxLength={1000}
                              rows={5}
                              placeholder="Write or edit your review here…"
                              style={{ width: '100%', padding: 'clamp(14px,2.5vw,18px)', border: 'none', outline: 'none', fontSize: '16px', lineHeight: 1.7, color: '#1a1714', background: 'transparent', resize: 'vertical', fontFamily: 'DM Sans,sans-serif', minHeight: '120px' }}
                            />
                            <div style={{ height: '3px', background: '#f0ede8' }}>
                              <div style={{ height: '100%', width: `${charPct}%`, background: charPct > 80 ? '#c8441a' : '#c49a2a', transition: 'width 0.2s ease' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(RATING_TAGS[rating] ?? []).map(({ label, text }) => (
                                <button key={label} className="quick-btn" onClick={() => setReviewText(t => (t + text).trim())} style={{ fontSize: '11px', fontWeight: 500, padding: '5px 12px', borderRadius: '99px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#6b6456', cursor: 'pointer', transition: 'background 0.15s' }}>
                                  + {label}
                                </button>
                              ))}
                            </div>
                            <span style={{ fontSize: '11px', color: reviewText.length > 800 ? '#c8441a' : '#a8a098', flexShrink: 0 }}>{reviewText.length}/1000</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Submit */}
                    {rating > 0 && (
                      <button className="submit-btn fade-up" onClick={handleSubmit} disabled={!reviewText.trim() || submitting} style={{ width: '100%', padding: 'clamp(14px,2.5vw,18px)', background: reviewText.trim() && !submitting ? '#c8441a' : '#e8e3db', color: reviewText.trim() && !submitting ? 'white' : '#b0a898', border: 'none', borderRadius: '16px', fontSize: 'clamp(13px,2vw,16px)', fontWeight: 500, cursor: reviewText.trim() && !submitting ? 'pointer' : 'not-allowed', boxShadow: reviewText.trim() ? '0 4px 20px rgba(200,68,26,0.35)' : 'none', transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        {submitting ? 'Saving & redirecting…' : 'Submit & Post on Google →'}
                      </button>
                    )}

                    {rating === 0 && (
                      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                        <p style={{ fontSize: '13px', color: '#c0bab2' }}>Select a star rating above to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="ff-side">
              <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', marginBottom: '4px' }}>Analytics</p>
              {[
                { label: 'Reviews collected', value: '2,841', sub: '↑ 18% this month', subColor: '#4ade80', cls: 'float-b' },
                { label: 'Avg rating', value: '4.6 ★', sub: 'across all locations', subColor: 'rgba(255,255,255,0.25)', cls: 'float-a', gold: true },
              ].map((s, i) => (
                <div key={i} className={mounted ? s.cls : ''} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)' }}>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '6px' }}>{s.label}</p>
                  <p style={{ fontSize: 'clamp(22px,2.5vw,28px)', fontWeight: 600, color: s.gold ? '#c49a2a' : 'rgba(255,255,255,0.88)', lineHeight: 1, marginBottom: '5px' }}>{s.value}</p>
                  <p style={{ fontSize: '10px', color: s.subColor }}>{s.sub}</p>
                </div>
              ))}
              <div className={mounted ? 'float-b' : ''} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '14px' }}>Recent activity</p>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {RECENT_ACTIVITY.map((r, i) => (
                    <div key={i}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>{r.name}</p>
                      <p style={{ color: '#c49a2a', fontSize: '10px', letterSpacing: '2px', marginBottom: '2px' }}>{'★'.repeat(r.stars)}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>{r.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}