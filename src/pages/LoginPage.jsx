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

const TICKER = 'Aptitude Assessment \u2014 187 students \u2014 MRIIRS \u00a0|\u00a0 Verbal Reasoning Test \u2014 142 students \u2014 MRU \u00a0|\u00a0 Campus Placement Mock \u2014 234 students \u2014 MRIIRS \u00a0|\u00a0 Quantitative Ability Drive \u2014 98 students \u2014 MRU \u00a0|\u00a0 Logical Reasoning \u2014 176 students \u2014 MRIIRS \u00a0|\u00a0 Communication Skills \u2014 121 students \u2014 MRU \u00a0|\u00a0 Pre-Placement Assessment \u2014 209 students \u2014 MRIIRS'

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
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ fontSize:24, fontWeight:700, letterSpacing:-1, lineHeight:1, color: blue?'#1a56db':'white' }}>
        {val.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:4, letterSpacing:0.3 }}>{label}</div>
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
    const cx = 90, cy = 90, r = 82
    function draw() {
      const now = new Date()
      const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds()
      ctx.clearRect(0, 0, 180, 180)
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0a1628'; ctx.fill()
      ctx.strokeStyle='rgba(26,86,219,0.4)'; ctx.lineWidth=1.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx,cy,r-10,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1; ctx.stroke()
      for(let i=0;i<60;i++){
        const a=(i/60)*Math.PI*2-Math.PI/2, isMaj=i%5===0
        ctx.beginPath()
        ctx.moveTo(cx+Math.cos(a)*(isMaj?r-14:r-9), cy+Math.sin(a)*(isMaj?r-14:r-9))
        ctx.lineTo(cx+Math.cos(a)*(r-4), cy+Math.sin(a)*(r-4))
        ctx.strokeStyle=isMaj?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.12)'; ctx.lineWidth=isMaj?1.5:0.8; ctx.stroke()
      }
      for(let i=0;i<12;i++){
        const a=(i/12)*Math.PI*2-Math.PI/2
        ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='8px Inter,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText(i===0?12:i, cx+Math.cos(a)*(r-22), cy+Math.sin(a)*(r-22))
      }
      function hand(angle,length,width,color){
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle)
        ctx.beginPath(); ctx.moveTo(0,length*0.2); ctx.lineTo(0,-length)
        ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.stroke(); ctx.restore()
      }
      hand(((h+m/60+s/3600)/12)*Math.PI*2-Math.PI/2, r*0.5, 3, 'rgba(255,255,255,0.9)')
      hand(((m+s/60)/60)*Math.PI*2-Math.PI/2, r*0.7, 2, 'rgba(255,255,255,0.7)')
      hand(((s+ms/1000)/60)*Math.PI*2-Math.PI/2, r*0.8, 1.2, '#1a56db')
      ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fillStyle='#1a56db'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fillStyle='white'; ctx.fill()
      const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
      const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      setDateStr(days[now.getDay()]+', '+now.getDate()+' '+months[now.getMonth()]+' '+now.getFullYear())
      setTimeStr(String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0'))
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <canvas ref={canvasRef} width={180} height={180} />
      <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'5px 16px', color:'rgba(255,255,255,0.45)', fontSize:11, letterSpacing:'0.5px' }}>{dateStr}</div>
      <div style={{ color:'rgba(255,255,255,0.18)', fontSize:11, letterSpacing:3, fontVariantNumeric:'tabular-nums' }}>{timeStr}</div>
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
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#03080f', padding:16, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:960, background:'#06101f', borderRadius:16, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr', border:'1px solid rgba(255,255,255,0.06)' }}>

        <div style={{ padding:'44px 40px', display:'flex', flexDirection:'column', justifyContent:'space-between', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:42, height:42, background:'#1a56db', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'white', fontSize:13, letterSpacing:'0.5px', flexShrink:0 }}>CDC</div>
              <div>
                <div style={{ color:'white', fontSize:16, fontWeight:600, letterSpacing:-0.3, lineHeight:1.2 }}>Career Development Centre</div>
                <div style={{ color:'rgba(255,255,255,0.28)', fontSize:10, letterSpacing:'0.8px', marginTop:2 }}>MANAV RACHNA EDUCATIONAL INSTITUTIONS · MREI</div>
              </div>
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(26,86,219,0.12)', border:'1px solid rgba(26,86,219,0.25)', color:'#60a5fa', fontSize:11, padding:'4px 10px', borderRadius:20, letterSpacing:'0.5px', margin:'12px 0 18px' }}>
              <div style={{ width:5, height:5, background:'#60a5fa', borderRadius:'50%' }} />
              Online Assessment System
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['MRIIRS — Deemed University','MRU — State University'].map(u=>(
                <div key={u} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'5px 10px', color:'rgba(255,255,255,0.45)', fontSize:10, fontWeight:500 }}>{u}</div>
              ))}
            </div>
            <div style={{ color:'rgba(255,255,255,0.28)', fontSize:10, letterSpacing:'2px', marginBottom:14 }}>3 YEARS · DIGITAL TRANSFORMATION JOURNEY</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
              {STATS.map((s,i)=><StatCard key={i} {...s} />)}
            </div>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px', overflow:'hidden' }}>
              <div style={{ color:'rgba(255,255,255,0.25)', fontSize:10, letterSpacing:'1px', marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ display:'inline-block', width:6, height:6, background:'#22c55e', borderRadius:'50%' }} />
                RECENT ACTIVITY
              </div>
              <div style={{ overflow:'hidden' }}>
                <span style={{ whiteSpace:'nowrap', color:'rgba(255,255,255,0.45)', fontSize:11, display:'inline-block', animation:'cdcScroll 24s linear infinite' }}>{TICKER}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop:18, color:'rgba(255,255,255,0.18)', fontSize:10 }}>Faridabad, Haryana, India</div>
        </div>

        <div style={{ padding:'36px 40px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}><AnalogClock /></div>
          <div style={{ color:'white', fontSize:20, fontWeight:600, letterSpacing:-0.5, marginBottom:3 }}>Welcome back</div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, marginBottom:20 }}>Sign in to CDC Online Assessment System</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:12 }}>
              <label style={{ color:'rgba(255,255,255,0.35)', fontSize:10, letterSpacing:'1.5px', display:'block', marginBottom:5 }}>EMAIL ADDRESS</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                placeholder="yourname.cdc@mriu.edu.in" autoComplete="email"
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, padding:'11px 14px', color:'white', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }} />
            </div>
            <div style={{ marginBottom:6 }}>
              <label style={{ color:'rgba(255,255,255,0.35)', fontSize:10, letterSpacing:'1.5px', display:'block', marginBottom:5 }}>PASSWORD</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                  placeholder="Enter your employee code" autoComplete="current-password"
                  style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, padding:'11px 40px 11px 14px', color:'white', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }} />
                <button type="button" onClick={()=>setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:0, display:'flex' }}>
                  {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
              <div style={{ color:'rgba(255,255,255,0.18)', fontSize:10, marginTop:4 }}>Default password is your employee code (e.g. 4500466)</div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width:'100%', background:'#1a56db', border:'none', borderRadius:10, padding:12, color:'white', fontSize:14, fontWeight:600, fontFamily:'Inter,sans-serif', cursor:'pointer', marginTop:10, letterSpacing:'0.3px', opacity:loading?0.7:1 }}>
              {loading?'Signing in...':'Sign In to Assessment Portal'}
            </button>
          </form>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:12 }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
            <div style={{ color:'rgba(255,255,255,0.18)', fontSize:10 }}>JWT Encrypted · 8hr Session · Anti-cheat Enabled</div>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:18, paddingTop:14, textAlign:'center', color:'rgba(255,255,255,0.18)', fontSize:11 }}>
            Students — use the exam link shared by your trainer. No login required.
          </div>
        </div>
      </div>
      <style>{`@keyframes cdcScroll{0%{transform:translateX(60%)}100%{transform:translateX(-100%)}} input:focus{border-color:rgba(26,86,219,0.6)!important;background:rgba(26,86,219,0.05)!important;} input::placeholder{color:rgba(255,255,255,0.18)!important}`}</style>
    </div>
  )
}
