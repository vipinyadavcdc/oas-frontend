import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATS = [
  { target: 26000, suffix: '+', label: 'Exams Conducted' },
  { target: 5000,  suffix: '+', label: 'Students Assessed' },
  { target: 12000, suffix: '+', label: 'Questions in Bank' },
  { target: 192,   suffix: '',  label: 'Avg Students/Exam' },
];

const TICKER_ITEMS = [
  'Online Assessment System — CDC, MREI',
  '26,000+ Exams Conducted in 3 Years',
  '5,000+ Students Assessed Across MRIIRS & MRU',
  'Aptitude | Verbal | Reasoning — All in One Platform',
  'Anti-Cheat Enabled — Secure & Fair Assessments',
  'Real-Time Monitoring & Analytics Dashboard',
  'Bulk Question Upload with Auto Tag Mapping',
];

const BARS = [
  { label: 'Aptitude & Reasoning', pct: 92, color: '#3b82f6' },
  { label: 'Verbal Skills',        pct: 87, color: '#10b981' },
  { label: 'Mock Assessments',     pct: 95, color: '#8b5cf6' },
  { label: 'Campus Placement',     pct: 83, color: '#f59e0b' },
];

function useCountUp(target, duration = 1600, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const elapsed = Math.max(0, now - start);
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
}

function AnimStat({ target, suffix, label, delay }) {
  const val = useCountUp(target, 1600, delay);
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '26px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
        {val.toLocaleString()}<span style={{ color: '#3b82f6' }}>{suffix}</span>
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

function AnimBar({ label, pct, color, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 300);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: '600' }}>{pct}%</span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, borderRadius: '3px', width: `${width}%`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const tickerRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);

  useEffect(() => {
    const speed = 0.4;
    const animate = () => {
      posRef.current -= speed;
      if (tickerRef.current) {
        const w = tickerRef.current.scrollWidth / 2;
        if (Math.abs(posRef.current) >= w) posRef.current = 0;
        tickerRef.current.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Email and password are required');
    const res = await login(email.trim(), password.trim());
    if (res.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      setError(res.error || 'Login failed. Check your credentials.');
    }
  };

  const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Segoe UI,Arial,sans-serif', background: '#060e1a' }}>

      {/* LEFT PANEL */}
      <div style={{ flex: '1 1 0', background: 'linear-gradient(160deg,#0a1628 0%,#0f2240 50%,#0a1a34 100%)', display: 'flex', flexDirection: 'column', padding: '40px 44px', position: 'relative', overflow: 'hidden', minWidth: 0 }}>

        {[
          { w: 320, h: 320, bg: '#1d4ed8', top: '-80px', right: '-60px', opacity: 0.06 },
          { w: 200, h: 200, bg: '#10b981', bottom: '60px', left: '-40px', opacity: 0.06 },
          { w: 160, h: 160, bg: '#8b5cf6', top: '45%', right: '10%', opacity: 0.04 },
        ].map((o, i) => (
          <div key={i} style={{ position: 'absolute', width: o.w, height: o.h, borderRadius: '50%', background: o.bg, top: o.top, bottom: o.bottom, left: o.left, right: o.right, opacity: o.opacity, pointerEvents: 'none' }} />
        ))}

        {/* Brand */}
        <div style={{ marginBottom: '32px', position: 'relative', zIndex: 2 }}>
          <div style={{ width: '48px', height: '48px', background: '#1d4ed8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '12px' }}>🎓</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>CDC Online Assessment System</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>Career Development Centre — Manav Rachna Educational Institutions</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(29,78,216,0.2)', border: '1px solid rgba(29,78,216,0.4)', color: '#93c5fd', fontSize: '10px', padding: '3px 10px', borderRadius: '20px' }}>MRIIRS — Deemed University</span>
            <span style={{ background: 'rgba(29,78,216,0.2)', border: '1px solid rgba(29,78,216,0.4)', color: '#93c5fd', fontSize: '10px', padding: '3px 10px', borderRadius: '20px' }}>MRU — State University</span>
          </div>
        </div>

        {/* Ticker */}
        <div style={{ background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.3)', borderRadius: '8px', padding: '10px 14px', overflow: 'hidden', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '7px', height: '7px', background: '#3b82f6', borderRadius: '50%', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div ref={tickerRef} style={{ display: 'flex', gap: '40px', whiteSpace: 'nowrap', willChange: 'transform' }}>
                {tickerContent.map((t, i) => (
                  <span key={i} style={{ fontSize: '12px', color: '#93c5fd', flexShrink: 0 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
          {STATS.map((s, i) => <AnimStat key={i} {...s} delay={i * 150} />)}
        </div>

        {/* Training bars */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessment Coverage</div>
          {BARS.map((b, i) => <AnimBar key={i} {...b} delay={i * 200} />)}
        </div>

        {/* 3 years badge */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '28px' }}>🏆</div>
            <div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>3 Years of Digital Excellence</div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>Fully online since 2022 — Anti-cheat · Real-time · Paperless</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: '380px', flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', background: '#0f2240', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 14px' }}>🎓</div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Welcome back</h1>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#64748b' }}>Sign in to CDC Online Assessment System</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="yourname.cdc@mriu.edu.in"
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#1d4ed8'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your employee code"
                style={{ width: '100%', padding: '12px 46px 12px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#1d4ed8'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9ca3af', padding: 0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#9ca3af' }}>Default password is your employee code (e.g. 4500466)</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '11px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : '#0f2240', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#0f2240'; }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { icon: '🔒', text: 'Secure Login' },
            { icon: '🏛️', text: 'MREI Internal' },
            { icon: '📱', text: 'Any Device' },
            { icon: '🔄', text: 'Live Sync' },
          ].map(b => (
            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#f8fafc', borderRadius: '8px', padding: '9px 12px' }}>
              <span style={{ fontSize: '14px' }}>{b.icon}</span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{b.text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Links</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: 'EMS Portal', icon: '🖥️', url: 'https://mrei.icloudems.com/' },
              { label: 'HR One',     icon: '👔', url: 'https://app.hrone.cloud/login' },
              { label: 'CDC Drive',  icon: '📁', url: 'https://drive.google.com/drive/my-drive' },
            ].map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 6px', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                <span style={{ fontSize: '18px' }}>{link.icon}</span>
                <span style={{ fontSize: '10px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#cbd5e1' }}>
          Students — use the exam link shared by your trainer
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#e2e8f0' }}>
          © 2026 Manav Rachna Educational Institutions
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.75); }
        }
        @media (max-width: 768px) {
          div[style*="flex: 1 1 0"] { display: none !important; }
          div[style*="width: 380px"] { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
