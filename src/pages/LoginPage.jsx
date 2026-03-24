import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATS = [
  { target: 26000, suffix: '+', label: 'Exams Conducted',   blue: true,  delay: 300 },
  { target: 5000,  suffix: '+', label: 'Students Assessed', blue: false, delay: 450 },
  { target: 12000, suffix: '+', label: 'Questions in Bank', blue: false, delay: 600 },
  { target: 192,   suffix: '',  label: 'Avg Students/Exam', blue: false, delay: 750 },
]

const TICKER = 'Aptitude Assessment — 187 students — MRIIRS \u00a0|\u00a0 Verbal Reasoning Test — 142 students — MRU \u00a0|\u00a0 Campus Placement Mock — 234 students — MRIIRS \u00a0|\u00a0 Quantitative Ability Drive — 98 students — MRU \u00a0|\u00a0 Logical Reasoning — 176 students — MRIIRS \u00a0|\u00a0 Communication Skills — 121 students — MRU \u00a0|\u00a0 Pre-Placement Assessment — 209 students — MRIIRS'

function StatCard({ target, suffix, label, blue, delay }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      function update(now) {
        const p = Math.min((now - start) / 2000, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(ease * target))
        if (p < 1) requestAnimationFrame(update)
      }
      requestAnimationFrame(update)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return (
    <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px' }}>
      <div style={{ fontSize:22, fontWeight:700, letterSpacing:-1, lineHeight:1, color: blue?'#3b82f6':'white' }}>
        {val.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3 }}>{label}</div>
    </div>
  )
}

function AnalogClock() {
  const canvasRef = useRef(null)
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const rafRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx = 75, cy = 75, r = 68
    function draw() {
      const now = new Date()
      const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds()
      ctx.clearRect(0, 0, 150, 150)
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0d1f3c'; ctx.fill()
      ctx.strokeStyle='rgba(59,130,246,0.5)'; ctx.lineWidth=1.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx,cy,r-8,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1; ctx.stroke()
      for(let i=0;i<60;i++){
        const a=(i/60)*Math.PI*2-Math.PI/2, isMaj=i%5===0
        ctx.beginPath()
        ctx.moveTo(cx+Math.cos(a)*(isMaj?r-12:r-7), cy+Math.sin(a)*(isMaj?r-12:r-7))
        ctx.lineTo(cx+Math.cos(a)*(r-3), cy+Math.sin(a)*(r-3))
        ctx.strokeStyle=isMaj?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.15)'; ctx.lineWidth=isMaj?1.5:0.8; ctx.stroke()
      }
      for(let i=0;i<12;i++){
        const a=(i/12)*Math.PI*2-Math.PI/2
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='7px Inter,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText(i===0?12:i, cx+Math.cos(a)*(r-19), cy+Math.sin(a)*(r-19))
      }
      function hand(angle,length,width,color){
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle)
        ctx.beginPath(); ctx.moveTo(0,length*0.2); ctx.lineTo(0,-length)
        ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.stroke(); ctx.restore()
      }
      hand(((h+m/60+s/3600)/12)*Math.PI*2-Math.PI/2, r*0.5, 2.5, 'rgba(255,255,255,0.95)')
      hand(((m+s/60)/60)*Math.PI*2-Math.PI/2, r*0.68, 2, 'rgba(255,255,255,0.75)')
      hand(((s+ms/1000)/60)*Math.PI*2-Math.PI/2, r*0.75, 1, '#3b82f6')
      ctx.beginPath(); ctx.arc(cx,cy,3.5,0,Math.PI*2); ctx.fillStyle='#3b82f6'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx,cy,1.5,0,Math.PI*2); ctx.fillStyle='white'; ctx.fill()
      const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      setDateStr(days[now.getDay()]+', '+now.getDate()+' '+months[now.getMonth()]+' '+now.getFullYear())
      setTimeStr(String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0'))
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <canvas ref={canvasRef} width={150} height={150} />
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, letterSpacing:'0.5px' }}>{dateStr}</div>
      <div style={{ color:'rgba(255,255,255,0.2)', fontSize:10, letterSpacing:3 }}>{timeStr}</div>
    </div>
  )
}

export default function LoginPage() {
  const [form, setForm] = useState({ email:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Enter email and password')
    const res = await login(form.email, form.password)
    if (res.success) { toast.success('Welcome back!'); navigate('/dashboard') }
    else toast.error(res.error || 'Login failed')
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#030b18', padding:'16px', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:980, display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, background:'#061020', borderRadius:18, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', minHeight:580 }}>

        {/* LEFT PANEL */}
        <div style={{ padding:'36px 32px', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:40, height:40, background:'#1d4ed8', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'white', fontSize:13, flexShrink:0 }}>CDC</div>
              <div>
                <div style={{ color:'white', fontSize:15, fontWeight:600, lineHeight:1.3 }}>Career Development Centre</div>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, letterSpacing:'1px', marginTop:1 }}>MANAV RACHNA EDUCATIONAL INSTITUTIONS · MREI</div>
              </div>
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(29,78,216,0.15)', border:'1px solid rgba(29,78,216,0.3)', color:'#93c5fd', fontSize:10, padding:'3px 10px', borderRadius:20, letterSpacing:'0.5px' }}>
              <div style={{ width:5, height:5, background:'#93c5fd', borderRadius:'50%' }} />
              Online Assessment System
            </div>
          </div>

          {/* University badges */}
          <div style={{ display:'flex', gap:6 }}>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 9px', color:'rgba(255,255,255,0.4)', fontSize:10 }}>MRIIRS — Deemed University</div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 9px', color:'rgba(255,255,255,0.4)', fontSize:10 }}>MRU — State University</div>
          </div>

          {/* Journey label */}
          <div style={{ color:'rgba(255,255,255,0.25)', fontSize:9, letterSpacing:'2px' }}>3 YEARS · DIGITAL TRANSFORMATION JOURNEY</div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {STATS.map((s,i) => <StatCard key={i} {...s} />)}
          </div>

          {/* Ticker */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'8px 12px', overflow:'hidden', marginTop:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
              <span style={{ width:6, height:6, background:'#22c55e', borderRadius:'50%', display:'inline-block' }} />
              <span style={{ color:'rgba(255,255,255,0.25)', fontSize:9, letterSpacing:'1px' }}>RECENT ACTIVITY</span>
            </div>
            <div style={{ overflow:'hidden' }}>
              <span style={{ whiteSpace:'nowrap', color:'rgba(255,255,255,0.4)', fontSize:10, display:'inline-block', animation:'cdcTicker 25s linear infinite' }}>{TICKER}</span>
            </div>
          </div>

          <div style={{ color:'rgba(255,255,255,0.15)', fontSize:9 }}>Faridabad, Haryana, India</div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ padding:'32px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:20 }}>

          {/* Clock */}
          <AnalogClock />

          {/* Divider */}
          <div style={{ width:'100%', height:'1px', background:'rgba(255,255,255,0.06)' }} />

          {/* Form */}
          <div style={{ width:'100%' }}>
            <div style={{ color:'white', fontSize:19, fontWeight:600, marginBottom:2, letterSpacing:-0.5 }}>Welcome back</div>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, marginBottom:18 }}>Sign in to CDC Online Assessment System</div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:12 }}>
                <label style={{ color:'rgba(255,255,255,0.35)', fontSize:10, letterSpacing:'1.5px', display:'block', marginBottom:5 }}>EMAIL ADDRESS</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                  placeholder="yourname.cdc@mriu.edu.in" autoComplete="email"
                  style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', color:'white', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:6 }}>
                <label style={{ color:'rgba(255,255,255,0.35)', fontSize:10, letterSpacing:'1.5px', display:'block', marginBottom:5 }}>PASSWORD</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                    placeholder="Your employee code" autoComplete="current-password"
                    style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 38px 10px 12px', color:'white', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }} />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', padding:0 }}>
                    {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
                <div style={{ color:'rgba(255,255,255,0.18)', fontSize:10, marginTop:4 }}>Default password is your employee code</div>
              </div>
              <button type="submit" disabled={loading}
                style={{ width:'100%', background:'#1d4ed8', border:'none', borderRadius:8, padding:'11px', color:'white', fontSize:13, fontWeight:600, fontFamily:'Inter,sans-serif', cursor:'pointer', marginTop:8, opacity:loading?0.7:1, letterSpacing:'0.3px' }}>
                {loading?'Signing in...':'Sign In to Assessment Portal'}
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:12 }}>
              <div style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
              <div style={{ color:'rgba(255,255,255,0.15)', fontSize:10 }}>JWT Encrypted · 8hr Session · Anti-cheat Enabled</div>
              <div style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:14, paddingTop:12, textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:10 }}>
              Students — use the exam link shared by your trainer
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cdcTicker { 0%{transform:translateX(50%)} 100%{transform:translateX(-100%)} }
        input:focus { border-color:rgba(29,78,216,0.7)!important; background:rgba(29,78,216,0.08)!important; }
        input::placeholder { color:rgba(255,255,255,0.2)!important }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
