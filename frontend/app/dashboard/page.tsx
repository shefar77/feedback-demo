'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDashboard, logout, getToken, updateProfile, hydrateCookieAuth } from '../../lib/auth';
import type { DashboardData } from '../../lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'overview'|'history'|'badges'|'profile'>('overview');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName]     = useState('');
  const [editBio, setEditBio]       = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving]         = useState(false);
  const [copyMsg, setCopyMsg]       = useState('');

  useEffect(() => {
    hydrateCookieAuth();
    if (!getToken()) { router.push('/login'); return; }
    fetchDashboard().then(d => { setData(d); setLoading(false); }).catch(() => { router.push('/login'); });
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile({ name: editName, bio: editBio, avatarUrl: editAvatar });
      const fresh = await fetchDashboard();
      setData(fresh);
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  function copyReferral() {
    navigator.clipboard.writeText(data!.referralLink).then(() => { setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000); });
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans,sans-serif', fontSize: '14px' }}>Loading dashboard…</div>
    </div>
  );

  if (!data) return null;
  const { user, stats, levels, badges, pointsHistory, recentFeedback, referralLink } = data;
  const lvl = user.levelInfo;
  const pct = lvl.nextLevel ? ((user.points - lvl.minPoints) / (lvl.nextLevel.minPoints - lvl.minPoints)) * 100 : 100;

  const C = { bg: '#0f0d0b', card: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.09)', text: 'rgba(255,255,255,0.88)', sub: 'rgba(255,255,255,0.4)', terra: '#c8441a', gold: '#c49a2a', green: '#4ade80' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'DM Sans,sans-serif', color: C.text }}>
      {/* BG */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,68,26,0.1) 0%,transparent 65%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: 'clamp(16px,4vw,32px)' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.terra, boxShadow: '0 0 10px rgba(200,68,26,0.7)' }} />
            <span style={{ fontFamily: 'Fraunces,serif', fontSize: '18px', fontWeight: 300 }}>Feedback Portal</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/')} style={{ fontSize: '13px', color: C.sub, background: 'none', border: `1px solid ${C.border}`, padding: '7px 16px', borderRadius: '99px', cursor: 'pointer' }}>
              Give Feedback
            </button>
            <button onClick={handleLogout} style={{ fontSize: '13px', color: C.terra, background: 'none', border: `1px solid rgba(200,68,26,0.3)`, padding: '7px 16px', borderRadius: '99px', cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Hero profile card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: 'clamp(20px,3vw,28px)', marginBottom: '24px', backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg,${C.terra},${C.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0, overflow: 'hidden', border: `2px solid rgba(255,255,255,0.15)` }}>
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(20px,3vw,26px)', fontWeight: 300, margin: 0 }}>{user.name}</h1>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px', background: `rgba(200,68,26,0.2)`, color: C.terra, border: `1px solid rgba(200,68,26,0.3)` }}>{lvl.name}</span>
              </div>
              <p style={{ fontSize: '13px', color: C.sub, margin: '0 0 12px' }}>{user.email}</p>
              {/* Level bar */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.sub, marginBottom: '6px' }}>
                  <span>Level {lvl.level} — {lvl.name}</span>
                  <span>{lvl.nextLevel ? `${lvl.pointsToNext} pts to Level ${lvl.nextLevel.level}` : 'Max level!'}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct,100)}%`, background: `linear-gradient(90deg,${C.terra},${C.gold})`, borderRadius: '99px', transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
            {/* Points */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(28px,5vw,40px)', fontWeight: 300, color: C.gold, lineHeight: 1 }}>{user.points.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: C.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total points</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total reviews', value: stats.totalFeedback, icon: '📝' },
            { label: 'Weekly points', value: `+${stats.weeklyPoints}`, icon: '⚡' },
            { label: 'Badges earned', value: stats.badgeCount, icon: '🏅' },
            { label: 'Current level', value: lvl.name, icon: '🎯' },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 'clamp(18px,3vw,24px)', fontWeight: 300, color: C.text, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: C.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(['overview','history','badges','profile'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: '1 1 80px', padding: '9px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', background: tab === t ? C.terra : 'transparent', color: tab === t ? 'white' : C.sub, transition: 'all 0.2s', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {/* Recent reviews */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.sub, marginBottom: '16px' }}>Recent submissions</h3>
              {recentFeedback.length === 0 ? (
                <p style={{ fontSize: '13px', color: C.sub }}>No feedback submitted yet. <span style={{ color: C.terra, cursor: 'pointer' }} onClick={() => router.push('/')}>Submit your first →</span></p>
              ) : recentFeedback.map((f, i) => (
                <div key={i} style={{ borderBottom: i < recentFeedback.length - 1 ? `1px solid ${C.border}` : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: C.gold, fontSize: '12px', letterSpacing: '2px' }}>{'★'.repeat(f.rating)}</span>
                    <span style={{ fontSize: '11px', color: C.sub }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>{f.finalText.slice(0,90)}{f.finalText.length > 90 ? '…' : ''}</p>
                </div>
              ))}
            </div>

            {/* Referral */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.sub, marginBottom: '12px' }}>Refer & earn</h3>
              <p style={{ fontSize: '12px', color: C.sub, marginBottom: '12px', lineHeight: 1.6 }}>Share your referral link. Earn <span style={{ color: C.gold }}>+8 points</span> for each friend who joins.</p>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', marginBottom: '12px', fontFamily: 'monospace' }}>
                {referralLink}
              </div>
              <button onClick={copyReferral} style={{ width: '100%', padding: '10px', background: copyMsg ? 'rgba(74,222,128,0.15)' : 'rgba(200,68,26,0.15)', color: copyMsg ? C.green : C.terra, border: `1px solid ${copyMsg ? 'rgba(74,222,128,0.3)' : 'rgba(200,68,26,0.3)'}`, borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                {copyMsg || 'Copy referral link'}
              </button>
            </div>

            {/* Quick badges preview */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.sub, marginBottom: '16px' }}>Achievements</h3>
              {badges.length === 0 ? (
                <p style={{ fontSize: '13px', color: C.sub }}>No badges yet. Submit feedback to earn your first!</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {badges.slice(0,6).map((b, i) => (
                    <div key={i} title={b.description} style={{ background: 'rgba(196,154,42,0.1)', border: '1px solid rgba(196,154,42,0.25)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>{b.icon}</span>
                      <span style={{ fontSize: '11px', color: C.gold, fontWeight: 500 }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: History */}
        {tab === 'history' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.sub, marginBottom: '16px' }}>Points history</h3>
            {pointsHistory.length === 0 ? <p style={{ fontSize: '13px', color: C.sub }}>No points activity yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {pointsHistory.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < pointsHistory.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div>
                      <p style={{ fontSize: '13px', color: C.text, margin: '0 0 3px' }}>{p.description}</p>
                      <p style={{ fontSize: '11px', color: C.sub, margin: 0 }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: C.green }}>+{p.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Badges */}
        {tab === 'badges' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.sub, marginBottom: '20px' }}>All badges</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' }}>
              {badges.map((b, i) => (
                <div key={i} style={{ background: 'rgba(196,154,42,0.08)', border: '1px solid rgba(196,154,42,0.2)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{b.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: C.gold, marginBottom: '4px' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: C.sub, lineHeight: 1.5 }}>{b.description}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
                    {new Date(b.earnedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {badges.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: C.sub, fontSize: '13px' }}>
                  Submit your first feedback to earn your first badge!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Profile */}
        {tab === 'profile' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', backdropFilter: 'blur(20px)', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.sub, marginBottom: '20px' }}>Edit profile</h3>
            {!editing ? (
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: C.sub, marginBottom: '4px' }}>Name</div>
                  <div style={{ fontSize: '14px', color: C.text }}>{user.name}</div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: C.sub, marginBottom: '4px' }}>Bio</div>
                  <div style={{ fontSize: '14px', color: user.bio ? C.text : C.sub }}>{user.bio || 'Not set'}</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: C.sub, marginBottom: '4px' }}>Avatar URL</div>
                  <div style={{ fontSize: '13px', color: user.avatarUrl ? C.text : C.sub, wordBreak: 'break-all' }}>{user.avatarUrl || 'Not set (+3 pts when added)'}</div>
                </div>
                <button onClick={() => { setEditName(user.name); setEditBio(user.bio ?? ''); setEditAvatar(user.avatarUrl ?? ''); setEditing(true); }} style={{ padding: '10px 24px', background: C.terra, color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                  Edit profile
                </button>
              </div>
            ) : (
              <div>
                {[
                  { label: 'Name', value: editName, set: setEditName, type: 'text' },
                  { label: 'Bio', value: editBio, set: setEditBio, type: 'text' },
                  { label: 'Avatar URL (+3 pts first time)', value: editAvatar, set: setEditAvatar, type: 'url' },
                ].map(({ label, value, set, type }) => (
                  <div key={label} style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.sub, marginBottom: '6px' }}>{label}</label>
                    <input value={value} onChange={e => set(e.target.value)} type={type} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px', fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleSaveProfile} disabled={saving} style={{ padding: '10px 24px', background: C.terra, color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button onClick={() => setEditing(false)} style={{ padding: '10px 20px', background: 'transparent', color: C.sub, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '13px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: 'rgba(255,255,255,0.12)' }}>Feedback Portal · Dashboard</p>
      </div>
    </div>
  );
}