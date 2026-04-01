// CDC PSYCHOMETRIC — PDF Report Generator
// Mindler-quality 40-50 page professional report
// Uses jsPDF + autoTable + Claude AI narrative
// Run in browser — download as PDF

import api from '../../../utils/api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── COLOR PALETTE ─────────────────────────────────────────────────────────────
const COLORS = {
  primary:   '#1e1b4b',
  purple:    '#6366f1',
  purpleLight:'#eff6ff',
  green:     '#16a34a',
  greenLight:'#dcfce7',
  red:       '#ef4444',
  redLight:  '#fee2e2',
  orange:    '#f97316',
  yellow:    '#f59e0b',
  blue:      '#2563eb',
  gray:      '#6b7280',
  lightGray: '#f3f4f6',
  white:     '#ffffff',
  border:    '#e5e7eb',
  text:      '#1f2937',
  textLight: '#6b7280',
}

const STANINE_COLORS = ['','#ef4444','#ef4444','#f97316','#eab308','#eab308','#22c55e','#22c55e','#16a34a','#059669']
const STANINE_LABELS = ['','Well Below Average','Below Average','Below Average','Average','Average','Above Average','Above Average','Well Above Average','Exceptional']
const STANINE_BG     = ['','#fee2e2','#fee2e2','#fff7ed','#fefce8','#fefce8','#dcfce7','#dcfce7','#bbf7d0','#a7f3d0']

// ── DIMENSION METADATA ────────────────────────────────────────────────────────
const DIM_META = {
  orientation: {
    label: 'Career Orientation',
    subtitle: 'Holland RIASEC Model',
    color: '#6366f1',
    icon: '🧭',
    scales: {
      realistic:     { label:'Realistic',     short:'R', desc:'Hands-on, practical, technical' },
      investigative: { label:'Investigative', short:'I', desc:'Analytical, curious, scientific' },
      artistic:      { label:'Artistic',      short:'A', desc:'Creative, expressive, aesthetic' },
      social:        { label:'Social',        short:'S', desc:'Helpful, caring, people-oriented' },
      enterprising:  { label:'Enterprising',  short:'E', desc:'Leadership, persuasive, business' },
      conventional:  { label:'Conventional',  short:'C', desc:'Organised, structured, detail-oriented' },
    }
  },
  personality: {
    label: 'Personality Profile',
    subtitle: 'Big Five OCEAN Model',
    color: '#8b5cf6',
    icon: '🧠',
    scales: {
      openness:          { label:'Openness to Experience', short:'O', desc:'Curiosity, creativity, intellectual engagement' },
      conscientiousness: { label:'Conscientiousness',      short:'C', desc:'Organisation, discipline, goal-directedness' },
      extraversion:      { label:'Extraversion',           short:'E', desc:'Sociability, assertiveness, positive energy' },
      agreeableness:     { label:'Agreeableness',          short:'A', desc:'Cooperativeness, empathy, trust' },
      stability:         { label:'Emotional Stability',    short:'N', desc:'Calmness, resilience, emotional regulation' },
    }
  },
  interest: {
    label: 'Interest Mapping',
    subtitle: 'Career Domain Interests',
    color: '#f59e0b',
    icon: '💡',
    scales: {
      engineering_tech: { label:'Engineering & Technology', short:'ET' },
      data_ai:          { label:'Data Science & AI',        short:'DA' },
      healthcare_med:   { label:'Healthcare & Medicine',    short:'HM' },
      business_mgmt:    { label:'Business & Management',    short:'BM' },
      creative_arts:    { label:'Creative Arts & Design',   short:'CA' },
      law_justice:      { label:'Law & Justice',            short:'LJ' },
      education:        { label:'Education & Training',     short:'ED' },
      finance_banking:  { label:'Finance & Banking',        short:'FB' },
      environment:      { label:'Environment & Sustainability', short:'EN' },
      media_comm:       { label:'Media & Communications',   short:'MC' },
      social_service:   { label:'Social Service & NGO',     short:'SS' },
      research_science: { label:'Research & Science',       short:'RS' },
    }
  },
  aptitude: {
    label: 'Aptitude Battery',
    subtitle: '10 Cognitive Abilities',
    color: '#ef4444',
    icon: '⚡',
    scales: {
      abstract:   { label:'Abstract Reasoning',     short:'AB' },
      verbal:     { label:'Verbal Reasoning',        short:'VR' },
      logical:    { label:'Logical Reasoning',       short:'LR' },
      numerical:  { label:'Numerical Ability',       short:'NA' },
      spatial:    { label:'Spatial Reasoning',       short:'SR' },
      language:   { label:'Language Usage',          short:'LU' },
      infotech:   { label:'Information Technology',  short:'IT' },
      mechanical: { label:'Mechanical Reasoning',    short:'MR' },
      perceptual: { label:'Perceptual Speed',        short:'PS' },
      creative:   { label:'Creative Thinking',       short:'CT' },
    }
  },
  eq: {
    label: 'Emotional Intelligence',
    subtitle: 'EQ Assessment',
    color: '#ec4899',
    icon: '❤️',
    scales: {
      empathy:       { label:'Empathy',             short:'EM' },
      conflict_mgmt: { label:'Conflict Management', short:'CM' },
      self_awareness:{ label:'Self-Awareness',      short:'SA' },
      emotional_reg: { label:'Emotional Regulation',short:'ER' },
      self_motivation:{ label:'Self-Motivation',    short:'SM' },
      social_skills: { label:'Social Skills',       short:'SS' },
      professionalism:{ label:'Professionalism',    short:'PR' },
    }
  },
  mi: {
    label: 'Multiple Intelligences',
    subtitle: "Gardner's 8 Intelligences",
    color: '#10b981',
    icon: '🌟',
    scales: {
      linguistic:    { label:'Linguistic',         short:'LI' },
      logical_math:  { label:'Logical-Mathematical',short:'LM' },
      spatial:       { label:'Spatial',            short:'SP' },
      musical:       { label:'Musical',            short:'MU' },
      kinesthetic:   { label:'Bodily-Kinesthetic', short:'BK' },
      interpersonal: { label:'Interpersonal',      short:'IP' },
      intrapersonal: { label:'Intrapersonal',      short:'IA' },
      naturalist:    { label:'Naturalist',         short:'NT' },
    }
  },
  values: {
    label: 'Work Values',
    subtitle: "Super's Work Values",
    color: '#0ea5e9',
    icon: '🎯',
    scales: {
      achievement:   { label:'Achievement',   short:'AC' },
      independence:  { label:'Independence',  short:'IN' },
      recognition:   { label:'Recognition',   short:'RE' },
      relationships: { label:'Relationships', short:'RL' },
      support:       { label:'Support',       short:'SU' },
      conditions:    { label:'Work Conditions',short:'WC' },
      security:      { label:'Security',      short:'SE' },
      variety:       { label:'Variety',       short:'VA' },
      creativity:    { label:'Creativity',    short:'CR' },
      lifestyle:     { label:'Lifestyle',     short:'LS' },
    }
  },
  learning: {
    label: 'Learning Style',
    subtitle: 'VAK + Kolb Model',
    color: '#14b8a6',
    icon: '📚',
    scales: {
      visual:      { label:'Visual',      short:'VI' },
      auditory:    { label:'Auditory',    short:'AU' },
      kinesthetic: { label:'Kinesthetic', short:'KI' },
      converger:   { label:'Converger',   short:'CO' },
      diverger:    { label:'Diverger',    short:'DI' },
      assimilator: { label:'Assimilator', short:'AS' },
      accommodator:{ label:'Accommodator',short:'AD' },
    }
  },
}

// ── NARRATIVE INSIGHTS ────────────────────────────────────────────────────────
function getOrientationInsight(scale, stanine) {
  const insights = {
    realistic: {
      high: 'You have a strong preference for hands-on, practical work. You thrive when working with tools, machines, or physical systems. Careers involving engineering, construction, technology hardware, or applied sciences align strongly with your nature.',
      avg:  'You have a moderate preference for practical work. You can engage with technical tasks when needed but may also enjoy people or idea-oriented activities.',
      low:  'Abstract and conceptual work tends to appeal to you more than hands-on physical tasks. You may prefer roles that involve ideas, communication, or working with others.',
    },
    investigative: {
      high: 'Your mind is naturally analytical and curious. You are drawn to complex problems that require research, experimentation, and intellectual depth. Careers in science, technology, research, data science, and medicine strongly suit you.',
      avg:  'You have a balanced analytical approach. You can engage with intellectual problems when motivated but also enjoy practical application.',
      low:  'You prefer action and interaction over deep analysis. Roles that involve people, persuasion, or creative execution may be more fulfilling than pure research.',
    },
    artistic: {
      high: 'Creativity and self-expression are central to who you are. You think in unique, unconventional ways and have a strong aesthetic sensibility. Careers in design, arts, media, writing, architecture, and innovation suit you exceptionally well.',
      avg:  'You have creative inclinations that can be a valuable asset in many roles. You appreciate creative work but can also function effectively in structured environments.',
      low:  'You prefer structured, well-defined tasks over open-ended creative expression. Your strengths likely lie in execution, precision, or working with established systems.',
    },
    social: {
      high: 'You are genuinely fulfilled by helping, teaching, and connecting with others. Your empathy and communication skills are natural strengths. Careers in education, counseling, healthcare, social work, and HR suit you deeply.',
      avg:  'You enjoy working with people in moderation. You can collaborate effectively but may also need independent work time to recharge.',
      low:  'You prefer working independently or with ideas/objects over intensive people interaction. Roles with limited social demands and high technical or creative focus may suit you better.',
    },
    enterprising: {
      high: 'You are naturally drawn to leadership, influence, and achievement. You thrive in competitive, goal-driven environments. Entrepreneurship, management, sales, law, and business leadership are strong career directions for you.',
      avg:  'You have a moderate drive for leadership and persuasion. You can lead when needed but also work effectively as an individual contributor.',
      low:  'You prefer collaborative, non-competitive environments. Leadership roles that involve heavy persuasion or competition may feel draining. Technical, creative, or helping roles may be more natural.',
    },
    conventional: {
      high: 'Structure, accuracy, and reliability are your strengths. You thrive in organised environments with clear systems and processes. Finance, accounting, administration, data management, and compliance are excellent career fits.',
      avg:  'You have a moderate appreciation for structure. You can work within systems but also adapt to less structured environments when needed.',
      low:  'You prefer flexibility and variety over rigid procedures. Roles with creative freedom or people interaction may be more energising than administrative or data-heavy work.',
    },
  }
  const level = stanine >= 7 ? 'high' : stanine >= 4 ? 'avg' : 'low'
  return insights[scale]?.[level] || ''
}

function getPersonalityInsight(scale, stanine) {
  const insights = {
    openness: {
      high: 'Your exceptionally high openness means you are intellectually voracious, creatively oriented, and constantly seeking new experiences and ideas. You thrive in roles that require innovation, creative problem-solving, and continuous learning.',
      avg:  'You balance curiosity with practicality. You can engage with new ideas when they are relevant and useful, while also appreciating proven approaches.',
      low:  'You prefer familiar, proven approaches over untested ideas. Your practical, grounded nature is a significant strength in roles requiring consistency, reliability, and execution.',
    },
    conscientiousness: {
      high: 'Your high conscientiousness reflects exceptional discipline, organisation, and goal-directedness. You are highly reliable and consistently deliver quality work. This trait is one of the strongest predictors of career success across all domains.',
      avg:  'You have a moderate level of organisation and discipline. You meet your commitments but also allow for flexibility and spontaneity.',
      low:  'You prefer flexibility over rigid structure. While this can fuel creativity, developing stronger planning habits could significantly amplify your career outcomes.',
    },
    extraversion: {
      high: 'You are energised by social interaction and naturally comfortable in the spotlight. Leadership, sales, client-facing, and collaborative roles align well with your extraverted nature.',
      avg:  'You are an ambivert — comfortable both in social situations and in independent work. This flexibility is a genuine career asset.',
      low:  'You recharge through solitude and prefer deep, focused work over constant social interaction. Technical, research, creative, and analytical roles that allow independent work suit you well.',
    },
    agreeableness: {
      high: 'Your high agreeableness reflects genuine warmth, empathy, and a cooperative spirit. You build trust naturally and excel in collaborative, supportive environments. Careers in teaching, healthcare, counseling, and team-based roles suit you well.',
      avg:  'You balance cooperation with assertiveness. You can be empathetic and collaborative while also standing your ground when needed.',
      low:  'You tend to prioritise task completion and outcomes over harmony. This can be a significant strength in competitive, analytical, or leadership roles where tough decisions are required.',
    },
    stability: {
      high: 'Your emotional stability is a significant career asset. You remain calm under pressure, recover from setbacks quickly, and make clear-headed decisions in stressful situations. High-stakes roles suit you well.',
      avg:  'You experience normal emotional fluctuations. With self-awareness and coping strategies, you can manage stress effectively across most career environments.',
      low:  'You are emotionally sensitive and may experience more stress than average in high-pressure environments. This sensitivity, when channelled constructively, can fuel empathy, creativity, and deep personal awareness.',
    },
  }
  const level = stanine >= 7 ? 'high' : stanine >= 4 ? 'avg' : 'low'
  return insights[scale]?.[level] || ''
}

// ── HTML REPORT GENERATOR ─────────────────────────────────────────────────────
export function generateHTMLReport(data, aiNarrative) {
  const { student, session, scores, hollandCode, careerMatches, flags, cseRoles } = data

  // Build score map
  const scoreMap = {}
  for (const s of (scores || [])) {
    if (!scoreMap[s.dimension]) scoreMap[s.dimension] = {}
    scoreMap[s.dimension][s.scale] = s
  }

  const stanineBar = (stanine, pct, color) => {
    const w  = Math.min(100, pct || 0)
    const bg = STANINE_COLORS[stanine] || color
    return `
      <div style="display:flex;align-items:center;gap:10px;margin:4px 0">
        <div style="flex:1;height:10px;background:#f3f4f6;border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${w}%;background:${bg};border-radius:5px"></div>
        </div>
        <div style="width:80px;text-align:right;font-size:11px;color:${bg};font-weight:700">
          ${(pct||0).toFixed(1)}% (${stanine}/9)
        </div>
      </div>`
  }

  const dimensionSection = (dimKey, dimMeta) => {
    const dimScores = scoreMap[dimKey] || {}
    if (!Object.keys(dimScores).length) return ''

    const rows = Object.entries(dimMeta.scales).map(([scale, meta]) => {
      const s = dimScores[scale]
      if (!s) return ''
      const insight = dimKey === 'orientation' ? getOrientationInsight(scale, s.stanine)
                    : dimKey === 'personality'  ? getPersonalityInsight(scale, s.stanine) : ''
      return `
        <div style="margin-bottom:20px;padding:16px;background:#fafafa;border-radius:10px;border-left:4px solid ${STANINE_COLORS[s.stanine]}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div>
              <span style="font-size:14px;font-weight:700;color:#1f2937">${meta.label}</span>
              ${meta.desc ? `<span style="font-size:11px;color:#6b7280;margin-left:8px">${meta.desc}</span>` : ''}
            </div>
            <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${STANINE_BG[s.stanine]};color:${STANINE_COLORS[s.stanine]}">${STANINE_LABELS[s.stanine]}</span>
          </div>
          ${stanineBar(s.stanine, s.percentage, dimMeta.color)}
          ${insight ? `<p style="font-size:12px;color:#4b5563;margin-top:10px;line-height:1.6">${insight}</p>` : ''}
        </div>`
    }).join('')

    return `
      <div style="page-break-before:always;padding:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid ${dimMeta.color}">
          <div style="width:48px;height:48px;border-radius:12px;background:${dimMeta.color}20;display:flex;align-items:center;justify-content:center;font-size:28px">${dimMeta.icon}</div>
          <div>
            <h2 style="font-size:20px;font-weight:800;color:#1e1b4b;margin:0">${dimMeta.label}</h2>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">${dimMeta.subtitle}</p>
          </div>
        </div>
        ${rows}
      </div>`
  }

  const careerSection = () => {
    if (!careerMatches?.length) return ''
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']
    return `
      <div style="page-break-before:always;padding:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #6366f1">
          <div style="width:48px;height:48px;border-radius:12px;background:#6366f120;display:flex;align-items:center;justify-content:center;font-size:28px">🎯</div>
          <div>
            <h2 style="font-size:20px;font-weight:800;color:#1e1b4b;margin:0">Top Career Matches</h2>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Calculated from cross-dimensional fusion scoring across all 7 dimensions</p>
          </div>
        </div>
        ${careerMatches.slice(0,5).map((cm, i) => `
          <div style="margin-bottom:20px;padding:20px;background:${i===0?'#eff6ff':'#fafafa'};border-radius:12px;border:${i===0?'2px solid #6366f1':'1px solid #e5e7eb'}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:24px">${medals[i]}</span>
                <div>
                  <h3 style="font-size:16px;font-weight:800;color:#1e1b4b;margin:0">${cm.name}</h3>
                  <span style="font-size:12px;color:#6b7280">${cm.category}</span>
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-size:28px;font-weight:900;color:${cm.composite_fit_pct>=80?'#16a34a':cm.composite_fit_pct>=65?'#f59e0b':'#ef4444'}">${cm.composite_fit_pct}%</div>
                <div style="font-size:11px;color:#6b7280">Overall Match</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
              ${[['Salary',cm.avg_salary_range],['Colleges (India)',cm.top_colleges_india?JSON.parse(cm.top_colleges_india).slice(0,2).join(', '):'—'],['Key Skills',cm.key_skills?.split(',').slice(0,2).join(', ')+'...'||'—']].map(([l,v]) => `
                <div style="padding:8px;background:white;border-radius:6px;border:1px solid #e5e7eb">
                  <div style="font-size:10px;color:#6b7280;font-weight:600">${l}</div>
                  <div style="font-size:12px;color:#1f2937;font-weight:600;margin-top:2px">${v||'—'}</div>
                </div>`).join('')}
            </div>
            <div style="font-size:12px;color:#4b5563;line-height:1.5">${cm.description||''}</div>
          </div>`).join('')}
      </div>`
  }

  const cseSection = () => {
    if (!cseRoles?.length) return ''
    return `
      <div style="page-break-before:always;padding:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #059669">
          <div style="width:48px;height:48px;border-radius:12px;background:#05996920;display:flex;align-items:center;justify-content:center;font-size:28px">💻</div>
          <div>
            <h2 style="font-size:20px;font-weight:800;color:#1e1b4b;margin:0">CSE Role Finder</h2>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Your best-fit technology career roles based on complete profile analysis</p>
          </div>
        </div>
        ${cseRoles.slice(0,5).map((r, i) => `
          <div style="margin-bottom:16px;padding:16px;background:${i===0?'#f0fdf4':'#fafafa'};border-radius:10px;border:${i===0?'2px solid #16a34a':'1px solid #e5e7eb'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:15px;font-weight:700;color:#1e1b4b">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${r.role_name}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:2px">Psychometric: ${r.psychometric_pct}% · Placement: ${r.placement_pct}%</div>
              </div>
              <div style="font-size:24px;font-weight:900;color:${i===0?'#16a34a':'#6366f1'}">${r.composite_match_pct}%</div>
            </div>
          </div>`).join('')}
      </div>`
  }

  const summaryDashboard = () => {
    const dims = Object.entries(DIM_META).filter(([k]) => scoreMap[k])
    return `
      <div style="page-break-before:always;padding:32px">
        <h2 style="font-size:20px;font-weight:800;color:#1e1b4b;margin:0 0 20px;padding-bottom:12px;border-bottom:3px solid #6366f1">Summary Dashboard</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${dims.map(([dimKey, dimMeta]) => {
            const dimScores = scoreMap[dimKey] || {}
            const topScales = Object.entries(dimScores).sort((a,b) => b[1].percentage - a[1].percentage).slice(0,3)
            return `
              <div style="padding:16px;background:#fafafa;border-radius:10px;border-top:4px solid ${dimMeta.color}">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                  <span style="font-size:20px">${dimMeta.icon}</span>
                  <span style="font-size:13px;font-weight:700;color:#1e1b4b">${dimMeta.label}</span>
                </div>
                ${topScales.map(([scale, s]) => `
                  <div style="margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
                      <span style="color:#4b5563">${dimMeta.scales[scale]?.label||scale}</span>
                      <span style="color:${STANINE_COLORS[s.stanine]};font-weight:700">${s.stanine}/9</span>
                    </div>
                    <div style="height:6px;background:#e5e7eb;border-radius:3px">
                      <div style="height:100%;width:${s.percentage}%;background:${STANINE_COLORS[s.stanine]};border-radius:3px"></div>
                    </div>
                  </div>`).join('')}
              </div>`
          }).join('')}
        </div>
      </div>`
  }

  const parentSummary = () => `
    <div style="page-break-before:always;padding:32px">
      <div style="background:#1e1b4b;color:white;padding:24px;border-radius:12px;margin-bottom:24px">
        <h2 style="font-size:20px;font-weight:800;margin:0 0 6px">Parent Summary</h2>
        <p style="font-size:12px;opacity:0.7;margin:0">A clear summary of your child's psychometric profile — written in simple language</p>
      </div>

      <div style="padding:20px;background:#f8fafc;border-radius:10px;margin-bottom:16px">
        <h3 style="font-size:15px;font-weight:700;color:#1e1b4b;margin:0 0 10px">About ${student.full_name?.split(' ')[0]}</h3>
        <p style="font-size:13px;color:#4b5563;line-height:1.7">
          ${student.full_name} has completed a comprehensive 7-dimensional psychometric assessment administered by the Career Development Centre, Manav Rachna Educational Institutions.
          This assessment scientifically measures career interests, personality traits, emotional intelligence, multiple intelligences, cognitive aptitudes, work values, and learning style.
          ${hollandCode ? `Based on the results, ${student.full_name?.split(' ')[0]}'s primary career orientation is <strong>${hollandCode.primary_type?.toUpperCase()}</strong> — ${hollandCode.primary_type === 'investigative' ? 'meaning they have a natural inclination for analytical, research-oriented, and problem-solving work.' : hollandCode.primary_type === 'social' ? 'meaning they are naturally drawn to helping, teaching, and working with people.' : hollandCode.primary_type === 'enterprising' ? 'meaning they have natural leadership, persuasion, and business instincts.' : hollandCode.primary_type === 'artistic' ? 'meaning they have strong creative and expressive tendencies.' : hollandCode.primary_type === 'realistic' ? 'meaning they prefer practical, hands-on, technical work.' : 'meaning they prefer organised, structured, detail-oriented work.'}` : ''}
        </p>
      </div>

      <div style="padding:20px;background:#f0fdf4;border-radius:10px;margin-bottom:16px">
        <h3 style="font-size:15px;font-weight:700;color:#065f46;margin:0 0 10px">🌟 Key Strengths Identified</h3>
        <p style="font-size:13px;color:#4b5563;line-height:1.7">
          ${Object.entries(scoreMap).map(([dim, scales]) => {
            const top = Object.entries(scales).sort((a,b) => b[1].stanine - a[1].stanine)[0]
            if (!top || top[1].stanine < 7) return null
            return `<strong>${DIM_META[dim]?.scales[top[0]]?.label || top[0]}</strong> (${DIM_META[dim]?.label})`
          }).filter(Boolean).slice(0,4).join(', ')}
          — these are areas where your child demonstrates above-average or exceptional ability.
        </p>
      </div>

      ${careerMatches?.length ? `
      <div style="padding:20px;background:#eff6ff;border-radius:10px;margin-bottom:16px">
        <h3 style="font-size:15px;font-weight:700;color:#1d4ed8;margin:0 0 10px">🎯 Top Recommended Career Paths</h3>
        ${careerMatches.slice(0,3).map((cm, i) => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #dbeafe">
            <span style="font-size:13px;font-weight:600;color:#1e1b4b">${['1st','2nd','3rd'][i]} Choice: ${cm.name}</span>
            <span style="font-size:13px;font-weight:700;color:#2563eb">${cm.composite_fit_pct}% fit</span>
          </div>`).join('')}
        <p style="font-size:12px;color:#6b7280;margin-top:10px">These recommendations are based on a scientific analysis of all 7 dimensions of your child's profile. A counseling session has been recommended to discuss these paths in detail.</p>
      </div>` : ''}

      <div style="padding:16px;background:#fff7ed;border-radius:10px;border-left:4px solid #f97316">
        <p style="font-size:12px;color:#7c2d12;margin:0;line-height:1.6">
          <strong>Important Note for Parents:</strong> This assessment is a guidance tool, not a definitive verdict. The results reflect your child's current inclinations and abilities. 
          Please encourage an open conversation with your child and the CDC counselor before making any major educational or career decisions. Human potential is far richer and more dynamic than any assessment can fully capture.
        </p>
      </div>
    </div>`

  const aiSection = () => {
    if (!aiNarrative) return ''
    return `
      <div style="page-break-before:always;padding:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #6366f1">
          <div style="width:48px;height:48px;border-radius:12px;background:#6366f120;display:flex;align-items:center;justify-content:center;font-size:28px">🤖</div>
          <div>
            <h2 style="font-size:20px;font-weight:800;color:#1e1b4b;margin:0">AI Career Narrative</h2>
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Powered by Claude AI — Personalised analysis for ${student.full_name}</p>
          </div>
        </div>
        <div style="font-size:13px;color:#374151;line-height:1.8;white-space:pre-wrap">${aiNarrative}</div>
      </div>`
  }

  const consistencySection = () => {
    if (!flags?.length) return ''
    return `
      <div style="padding:20px;background:#fff7ed;border-radius:10px;margin:16px 32px;border:1px solid #fed7aa">
        <h3 style="font-size:13px;font-weight:700;color:#c2410c;margin:0 0 8px">⚠️ Assessment Integrity Notes (For Counselor Only)</h3>
        ${flags.map(f => `<p style="font-size:12px;color:#7c2d12;margin:4px 0">• ${f.dimension}: ${f.description}</p>`).join('')}
      </div>`
  }

  // ── FULL HTML REPORT ──────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>CDC Psychometric Report — ${student.full_name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: white; }
  @media print {
    .no-print { display:none; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div style="min-height:100vh;background:linear-gradient(135deg,#1e1b4b,#312e81,#4338ca);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px;text-align:center;position:relative">
  <div style="position:absolute;top:30px;left:0;right:0;display:flex;justify-content:space-between;padding:0 60px">
    <div style="font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:2px">CAREER DEVELOPMENT CENTRE</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.6)">CONFIDENTIAL</div>
  </div>

  <div style="width:100px;height:100px;background:rgba(255,255,255,0.15);border-radius:24px;display:flex;align-items:center;justify-content:center;margin-bottom:32px;font-size:56px">🧭</div>
  
  <div style="font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:3px;margin-bottom:12px">MANAV RACHNA EDUCATIONAL INSTITUTIONS</div>
  <h1 style="font-size:36px;font-weight:900;color:white;margin-bottom:8px;line-height:1.2">Psychometric<br>Assessment Report</h1>
  <div style="width:60px;height:4px;background:#6366f1;border-radius:2px;margin:20px auto"></div>

  <div style="margin-top:40px;background:rgba(255,255,255,0.1);border-radius:16px;padding:24px 40px;min-width:400px">
    <div style="font-size:22px;font-weight:800;color:white;margin-bottom:4px">${student.full_name}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:16px">
      ${student.student_type === 'school' ? `Class ${student.class_grade} | ${student.board || ''} | ${student.stream || ''}` : `${student.course_branch || ''} | ${student.year_of_study || ''} Year | ${student.institution_name || ''}`}
    </div>
    <div style="display:flex;gap:16px;justify-content:center;font-size:12px;color:rgba(255,255,255,0.6)">
      <span>📋 ID: ${student.participant_id}</span>
      <span>📅 ${new Date(session?.completed_at || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}</span>
      ${hollandCode ? `<span>🧭 Holland Code: <strong style="color:white">${hollandCode.code}</strong></span>` : ''}
    </div>
  </div>

  <div style="position:absolute;bottom:30px;font-size:11px;color:rgba(255,255,255,0.4)">
    7+1 Dimensional Assessment · RIASEC · Big Five · EQ · MI · Aptitude · Values · Learning Style
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div style="padding:40px 60px;background:#f8fafc;min-height:50vh">
  <h2 style="font-size:22px;font-weight:800;color:#1e1b4b;margin-bottom:24px">Contents</h2>
  ${[
    ['01', 'Career Orientation (RIASEC)', '🧭', '#6366f1'],
    ['02', 'Personality Profile (Big Five)', '🧠', '#8b5cf6'],
    ['03', 'Interest Mapping', '💡', '#f59e0b'],
    ['04', 'Aptitude Battery', '⚡', '#ef4444'],
    ['05', 'Emotional Intelligence', '❤️', '#ec4899'],
    ['06', 'Multiple Intelligences', '🌟', '#10b981'],
    ['07', 'Work Values', '🎯', '#0ea5e9'],
    ['08', 'Learning Style', '📚', '#14b8a6'],
    ['09', 'Summary Dashboard', '📊', '#6366f1'],
    ['10', 'Top Career Matches', '🎯', '#6366f1'],
    ...(cseRoles?.length ? [['11', 'CSE Role Finder', '💻', '#059669']] : []),
    ...(aiNarrative ? [['12', 'AI Career Narrative', '🤖', '#6366f1']] : []),
    ['13', 'Parent Summary', '👨‍👩‍👧', '#1e1b4b'],
  ].map(([num, label, icon, color]) => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #e5e7eb">
      <span style="font-size:12px;color:${color};font-weight:700;width:24px">${num}</span>
      <span style="font-size:18px">${icon}</span>
      <span style="font-size:14px;color:#1f2937;font-weight:600">${label}</span>
    </div>`).join('')}
</div>

<!-- HOLLAND CODE HIGHLIGHT -->
${hollandCode ? `
<div style="page-break-before:always;padding:40px 60px;background:white">
  <h2 style="font-size:20px;font-weight:800;color:#1e1b4b;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #6366f1">Your Holland Code</h2>
  <div style="display:flex;gap:16px;margin-bottom:24px;justify-content:center">
    ${[hollandCode.primary_type, hollandCode.secondary_type, hollandCode.tertiary_type].filter(Boolean).map((type, i) => `
      <div style="text-align:center;padding:24px;background:${['#6366f1','#8b5cf6','#a78bfa'][i]}20;border-radius:16px;border:2px solid ${['#6366f1','#8b5cf6','#a78bfa'][i]};min-width:140px">
        <div style="font-size:48px;font-weight:900;color:${['#6366f1','#8b5cf6','#a78bfa'][i]}">${type[0].toUpperCase()}</div>
        <div style="font-size:14px;font-weight:700;color:#1e1b4b;margin-top:4px">${type.charAt(0).toUpperCase()+type.slice(1)}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px">${['Primary','Secondary','Tertiary'][i]}</div>
      </div>`).join('')}
  </div>
  <p style="font-size:13px;color:#4b5563;line-height:1.7;max-width:600px;margin:0 auto;text-align:center">
    Your Holland Code <strong style="color:#6366f1">${hollandCode.code}</strong> represents your top three career interest types.
    This three-letter code is a globally recognised framework used by career counselors worldwide to match individuals to their most fulfilling work environments.
  </p>
</div>` : ''}

<!-- ALL DIMENSION SECTIONS -->
${Object.entries(DIM_META).map(([key, meta]) => dimensionSection(key, meta)).join('')}

<!-- SUMMARY DASHBOARD -->
${summaryDashboard()}

<!-- CAREER MATCHES -->
${careerSection()}

<!-- CSE ROLES -->
${cseSection()}

<!-- AI NARRATIVE -->
${aiSection()}

<!-- CONSISTENCY FLAGS -->
${consistencySection()}

<!-- PARENT SUMMARY -->
${parentSummary()}

<!-- BACK COVER -->
<div style="page-break-before:always;background:linear-gradient(135deg,#1e1b4b,#312e81);min-height:30vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center">
  <div style="font-size:32px;margin-bottom:16px">🧭</div>
  <h2 style="font-size:18px;font-weight:800;color:white;margin-bottom:8px">Career Development Centre</h2>
  <p style="font-size:13px;color:rgba(255,255,255,0.7)">Manav Rachna Educational Institutions</p>
  <div style="width:40px;height:2px;background:#6366f1;margin:16px auto"></div>
  <p style="font-size:11px;color:rgba(255,255,255,0.4)">This report is strictly confidential. For internal use only.<br>Assessment powered by CDC OAS Psychometric System.</p>
</div>

</body>
</html>`
}

// ── AI NARRATIVE GENERATOR ────────────────────────────────────────────────────
export async function generateAINarrative(data, onChunk) {
  const { student, hollandCode, scores, careerMatches } = data
  const scoreMap = {}
  for (const s of (scores || [])) {
    if (!scoreMap[s.dimension]) scoreMap[s.dimension] = {}
    scoreMap[s.dimension][s.scale] = s
  }

  const topDimScores = Object.entries(scoreMap).map(([dim, scales]) => {
    const top = Object.entries(scales).sort((a,b) => b[1].stanine - a[1].stanine)[0]
    return `${DIM_META[dim]?.label}: strongest in ${DIM_META[dim]?.scales[top[0]]?.label||top[0]} (stanine ${top[1].stanine}/9, ${top[1].percentage.toFixed(0)}%)`
  }).join('\n')

  const prompt = `You are a world-class career counselor writing a personalised psychometric report narrative for ${student.full_name}, a ${student.student_type === 'school' ? `Class ${student.class_grade} student` : `${student.course_branch} student in ${student.year_of_study} year`} from ${student.institution_name || 'Manav Rachna'}.

Their assessment results:
Holland Code: ${hollandCode?.code || 'Not available'}
Primary type: ${hollandCode?.primary_type || ''}
Secondary type: ${hollandCode?.secondary_type || ''}

Key scores across 7 dimensions:
${topDimScores}

Top 3 career matches: ${careerMatches?.slice(0,3).map(c => `${c.name} (${c.composite_fit_pct}%)`).join(', ') || 'Not available'}

Write a deeply personalised, warm, insightful, and professionally written narrative of approximately 600-700 words covering:

1. **Who You Are** — A rich paragraph describing their unique combination of traits, what makes them distinctive, and how their personality and interests naturally align.

2. **How You Think and Learn** — Explain their cognitive style, how they process information, their natural intellectual strengths, and what kinds of environments bring out their best.

3. **What Motivates You** — Based on their work values and EQ profile, describe what genuinely drives them, what kind of work gives them meaning, and what they should look for in a work environment.

4. **Your Path Forward** — A forward-looking, inspiring paragraph about their recommended direction, why those specific career matches fit them, and what their unique career journey might look like.

5. **A Personal Message** — End with a direct, warm, encouraging message to ${student.full_name?.split(' ')[0]} personally — acknowledging their strengths, being honest about growth areas, and inspiring them with genuine optimism about their future.

Write in second person ("You are...", "Your..."). Be specific — reference their actual scores. Be warm but professional. Avoid generic statements. This is a premium, Mindler-quality report.`

  const token = sessionStorage.getItem('psy_token') || localStorage.getItem('cdc_token')
  const res = await fetch(`${API}/psychometric/ai-report`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
    body: JSON.stringify({ prompt })
  })

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))
    for (const line of lines) {
      try {
        if (line.includes('[DONE]')) break
        const json = JSON.parse(line.slice(6))
        if (json.text) { full += json.text; onChunk?.(full) }
      } catch {}
    }
  }
  return full
}

// ── DOWNLOAD REPORT ───────────────────────────────────────────────────────────
export async function downloadReport(data, onProgress) {
  onProgress?.('Generating AI narrative...')
  let aiNarrative = ''
  try {
    aiNarrative = await generateAINarrative(data, (partial) => onProgress?.('Writing narrative...'))
  } catch { aiNarrative = '' }

  onProgress?.('Building report...')
  const html = generateHTMLReport(data, aiNarrative)

  onProgress?.('Preparing download...')
  const blob = new Blob([html], { type: 'application/msword' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `CDC_Psychometric_Report_${data.student?.full_name?.replace(/\s+/g,'_')}_${data.student?.participant_id}.doc`
  a.click()
  URL.revokeObjectURL(url)
  onProgress?.('Done!')
}
