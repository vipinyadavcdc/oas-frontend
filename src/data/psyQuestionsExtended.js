// CDC PSYCHOMETRIC — Extended Question Bank
// Phase 4: Starter / Intermediate / Pro levels
// Intermediate = existing questions (Phase 1)
// This file adds Starter (easier/fewer) and Pro (harder/more) questions

// ── LEVEL CONFIGURATION ───────────────────────────────────────────────────────
export const LEVEL_CONFIG = {
  starter: {
    label: 'Starter',
    color: '#22c55e',
    icon: '🌱',
    description: 'Suitable for Class 8-10 students — shorter, simpler',
    counts: { orientation:24, personality:25, interest:15, aptitude:25, eq:10, mi:16, values:10, learning:6 },
    times:  { orientation:'5 min', personality:'6 min', interest:'4 min', aptitude:'15 min', eq:'5 min', mi:'5 min', values:'3 min', learning:'2 min' },
  },
  intermediate: {
    label: 'Intermediate',
    color: '#f59e0b',
    icon: '📘',
    description: 'Standard level — Class 11-12 and college students',
    counts: { orientation:48, personality:50, interest:25, aptitude:50, eq:20, mi:24, values:15, learning:10 },
    times:  { orientation:'10 min', personality:'12 min', interest:'8 min', aptitude:'25 min', eq:'10 min', mi:'8 min', values:'6 min', learning:'5 min' },
  },
  pro: {
    label: 'Pro',
    color: '#6366f1',
    icon: '🚀',
    description: 'Deep assessment — final year / placement / graduate',
    counts: { orientation:72, personality:60, interest:40, aptitude:70, eq:30, mi:40, values:25, learning:15 },
    times:  { orientation:'15 min', personality:'18 min', interest:'10 min', aptitude:'40 min', eq:'15 min', mi:'12 min', values:'8 min', learning:'6 min' },
  }
}

// ── STARTER QUESTIONS (subset of intermediate — first N questions) ─────────────
// Starter uses first 24 RIASEC, first 25 Big Five, etc. from existing psyQuestions.js
// No new questions needed for starter — just slice the existing arrays

// ── PRO ADDITIONAL QUESTIONS ─────────────────────────────────────────────────
// These are ADDED to the intermediate set for Pro level

// PRO RIASEC — 24 additional (total 72 at Pro)
export const ORIENTATION_PRO = [
  // Extended REALISTIC
  { id:'O49', scale:'realistic', text:`Diagnose and repair complex electronic circuit boards` },
  { id:'O50', scale:'realistic', text:`Build or maintain computer hardware systems` },
  { id:'O51', scale:'realistic', text:`Install and configure networking infrastructure` },
  { id:'O52', scale:'realistic', text:`Work with precision measuring instruments in a lab` },
  // Extended INVESTIGATIVE
  { id:'O53', scale:'investigative', text:`Develop mathematical proofs or theoretical models` },
  { id:'O54', scale:'investigative', text:`Design controlled experiments to test hypotheses` },
  { id:'O55', scale:'investigative', text:`Write technical research papers or scientific reports` },
  { id:'O56', scale:'investigative', text:`Analyse competitor strategies using market data` },
  // Extended ARTISTIC
  { id:'O57', scale:'artistic', text:`Develop a personal creative style recognised by others' },
  { id:`O58', scale:'artistic', text:`Create immersive digital experiences or interactive media` },
  { id:'O59', scale:'artistic', text:`Write and produce original music compositions` },
  { id:'O60', scale:'artistic', text:`Conceptualise and execute a large-scale creative project` },
  // Extended SOCIAL
  { id:'O61', scale:'social', text:`Design and deliver large-scale public health programmes` },
  { id:'O62', scale:'social', text:`Develop curriculum and educational policy for institutions` },
  { id:'O63', scale:'social', text:`Lead group therapy or community mental health sessions` },
  { id:'O64', scale:'social', text:`Advocate for policy change on social justice issues` },
  // Extended ENTERPRISING
  { id:'O65', scale:'enterprising', text:`Develop a detailed business plan and pitch to investors` },
  { id:'O66', scale:'enterprising', text:`Build and scale a team from 5 to 50 people` },
  { id:'O67', scale:'enterprising', text:`Negotiate high-stakes contracts worth crores of rupees` },
  { id:'O68', scale:'enterprising', text:`Create a go-to-market strategy for a new product launch` },
  // Extended CONVENTIONAL
  { id:'O69', scale:'conventional', text:`Design and implement enterprise data governance policies` },
  { id:'O70', scale:'conventional', text:`Ensure regulatory compliance across multiple departments` },
  { id:'O71', scale:'conventional', text:`Develop standardised operating procedures for an organisation` },
  { id:'O72', scale:'conventional', text:`Manage complex multi-year financial budgets and forecasts` },
]

// PRO BIG FIVE — 10 additional (total 60 at Pro)
export const PERSONALITY_PRO = [
  // Additional OPENNESS facets — Aesthetic Sensitivity + Intellectual Curiosity
  { id:'P51', scale:'openness', reverse:false, text:`I actively seek out experiences that challenge my worldview` },
  { id:'P52', scale:'openness', reverse:false, text:`I find beauty in things most people overlook` },
  // Additional CONSCIENTIOUSNESS — Long-term orientation
  { id:'P53', scale:'conscientiousness', reverse:false, text:`I consistently work towards long-term goals even when immediate rewards are absent` },
  { id:'P54', scale:'conscientiousness', reverse:true,  text:`I sometimes cut corners when no one is watching` },
  // Additional EXTRAVERSION — Social leadership
  { id:'P55', scale:'extraversion', reverse:false, text:`I naturally take charge in group situations without being asked` },
  { id:'P56', scale:'extraversion', reverse:false, text:`I find energy in large crowds and high-stimulation environments` },
  // Additional AGREEABLENESS — Moral concern
  { id:'P57', scale:'agreeableness', reverse:false, text:`I feel a strong moral obligation to help those less fortunate` },
  { id:'P58', scale:'agreeableness', reverse:true,  text:`I can be manipulative when I need to get what I want` },
  // Additional STABILITY — Resilience under pressure
  { id:'P59', scale:'stability', reverse:false, text:`Under extreme pressure I remain clear-headed and make rational decisions` },
  { id:'P60', scale:'stability', reverse:false, text:`I have a consistent sense of identity even when others challenge it` },
]

// PRO INTEREST — 15 additional (total 40 at Pro)
export const INTEREST_PRO = [
  { id:'I26', scale:'engineering_tech',  text:`Contributing to open-source projects or developer communities` },
  { id:'I27', scale:'data_ai',           text:`Publishing research findings in AI or data science journals` },
  { id:'I28', scale:'healthcare_med',    text:`Conducting clinical trials or medical research studies` },
  { id:'I29', scale:'business_mgmt',     text:`Driving organisational transformation and change management` },
  { id:'I30', scale:'creative_arts',     text:`Producing commercially successful creative work at scale` },
  { id:'I31', scale:'law_justice',       text:`Arguing constitutional or high-stakes cases in superior courts` },
  { id:'I32', scale:'education',         text:`Designing learning systems or educational technology platforms` },
  { id:'I33', scale:'finance_banking',   text:`Managing institutional investment portfolios worth billions` },
  { id:'I34', scale:'environment',       text:`Developing carbon sequestration or climate intervention strategies` },
  { id:'I35', scale:'media_comm',        text:`Building a media brand with millions of followers or readers` },
  { id:'I36', scale:'social_service',    text:`Designing large-scale poverty alleviation or welfare programmes` },
  { id:'I37', scale:'research_science',  text:`Pursuing breakthrough discoveries that redefine a scientific field` },
  { id:'I38', scale:'psychology',        text:`Developing new therapeutic frameworks or psychological models` },
  { id:'I39', scale:'aviation_space',    text:`Working on next-generation space exploration missions` },
  { id:'I40', scale:'defense_security',  text:`Developing national cybersecurity or intelligence systems` },
]

// PRO APTITUDE — 20 additional harder questions (total 70 at Pro)
export const APTITUDE_PRO = [
  // Advanced Abstract (5Q)
  { id:'AP1', scale:'abstract', time:90,
    text:`If the pattern rule is: each term = sum of previous two terms × 0.5, starting with 2,4 — what is the 5th term?`,
    options:['9','10','11','12'], correct:0 },
  { id:'AP2', scale:'abstract', time:90,
    text:`A sequence follows: 1, 1, 2, 3, 5, 8, 13, ? What property does this sequence have?`,
    options:['Each term doubles','Each term is sum of two preceding terms','Each term increases by 3','Prime numbers'], correct:1 },
  { id:'AP3', scale:'abstract', time:90,
    text:`In a 3×3 matrix, rows sum to 15, columns sum to 15. Centre value is 5. What is the sum of corners?`,
    options:['16','20','18','24'], correct:1 },
  { id:'AP4', scale:'abstract', time:90,
    text:`If A∩B has 12 elements, A has 20, B has 18, how many elements in A∪B?`,
    options:['26','28','30','32'], correct:0 },
  { id:'AP5', scale:'abstract', time:90,
    text:`A clock gains 5 minutes every hour. Set correctly at 9am. What does it show at actual time 3pm?`,
    options:['3:30pm','3:28pm','3:35pm','3:25pm'], correct:0 },

  // Advanced Logical (5Q)
  { id:'AP6', scale:'logical', time:90,
    text:`If "some A are B" and "all B are C" then which must be true?`,
    options:['All A are C','Some A are C','No A are C','All C are A'], correct:1 },
  { id:'AP7', scale:'logical', time:90,
    text:`5 projects A,B,C,D,E. B must come after A. D must come before C. E must be last. A must be first. What is valid order?`,
    options:['A,B,D,C,E','A,D,B,C,E','D,A,B,C,E','A,B,C,D,E'], correct:1 },
  { id:'AP8', scale:'logical', time:90,
    text:`In a group: all programmers know Python. Some programmers know Java. All Java-knowers know SQL. Ravi knows Java. What can be concluded?`,
    options:['Ravi is a programmer','Ravi knows Python','Ravi knows SQL','Ravi knows all languages'], correct:2 },
  { id:'AP9', scale:'logical', time:90,
    text:`Statement: "Only experienced developers lead critical projects." Ravi leads a critical project. Therefore:`,
    options:['Ravi is definitely experienced','Ravi may or may not be experienced','Ravi is definitely not experienced','Nothing can be concluded'], correct:0 },
  { id:'AP10', scale:'logical', time:90,
    text:`A truth-teller always tells truth, liar always lies. Person says "I am a liar." This statement is:`,
    options:['True — they are a liar','False — they are a truth-teller','A paradox — impossible','True if context allows'], correct:2 },

  // Advanced Numerical (5Q)
  { id:'AP11', scale:'numerical', time:90,
    text:`Compound interest on ₹10,000 at 10% p.a. for 3 years (compounded annually):`,
    options:['₹3,000','₹3,100','₹3,310','₹3,500'], correct:2 },
  { id:'AP12', scale:'numerical', time:90,
    text:`A team of 5 can complete a project in 20 days. After 10 days, 3 members leave. How many more days to finish?`,
    options:['20','25','30','15'], correct:1 },
  { id:'AP13', scale:'numerical', time:90,
    text:`Profit = 25% of cost. Selling price = ₹500. What is the cost price?`,
    options:['₹375','₹400','₹425','₹350'], correct:1 },
  { id:'AP14', scale:'numerical', time:90,
    text:`Two pipes fill a tank in 12 and 18 hours. A drain empties it in 9 hours. All open: tank fills in?`,
    options:['18 hours','36 hours','Never fills','24 hours'], correct:1 },
  { id:'AP15', scale:'numerical', time:90,
    text:`Speed of boat in still water = 15 km/h. Stream = 5 km/h. Time to go 60 km upstream and return:`,
    options:['8 hours','9 hours','10 hours','7.5 hours'], correct:0 },

  // Advanced Info Tech (5Q)
  { id:'AP16', scale:'infotech', time:60,
    text:`Time complexity of quicksort in worst case:`,
    options:['O(n log n)','O(n²)','O(n)','O(log n)'], correct:1 },
  { id:'AP17', scale:'infotech', time:60,
    text:`In TCP/IP, which layer handles end-to-end communication?`,
    options:['Network','Data Link','Transport','Application'], correct:2 },
  { id:'AP18', scale:'infotech', time:60,
    text:`Normalisation to 3NF eliminates:`,
    options:['All redundancy','Partial dependencies and transitive dependencies','Only partial dependencies','Only primary key issues'], correct:1 },
  { id:'AP19', scale:'infotech', time:60,
    text:`Which design pattern ensures only one instance of a class exists?`,
    options:['Factory','Observer','Singleton','Decorator'], correct:2 },
  { id:'AP20', scale:'infotech', time:60,
    text:`CAP theorem states a distributed system can guarantee at most:`,
    options:['All 3 of Consistency, Availability, Partition tolerance','2 of 3 of CAP','Only Consistency and Availability','Only Partition tolerance'], correct:1 },
]

// PRO EQ — 10 additional complex scenarios (total 30 at Pro)
export const EQ_PRO = [
  { id:'EQ21', scale:'self_awareness',
    text:`You realise mid-project that you took on too many responsibilities and cannot deliver quality work on all. You:`,
    options:['Deliver everything at poor quality','Proactively communicate to stakeholders, renegotiate scope, and focus on what matters most','Silently drop some tasks','Work 24 hours to finish everything regardless of health'],
    weights:[1,9,2,3] },
  { id:'EQ22', scale:'social_skills',
    text:`You are managing a cross-cultural remote team. Communication breakdowns keep occurring due to cultural differences. You:`,
    options:['Insist everyone follows your communication style','Invest time in understanding each person\'s cultural context and adapt your approach','Hire only people from your own culture next time','Reduce team communication to a minimum'],
    weights:[0,9,1,2] },
  { id:'EQ23', scale:'empathy',
    text:`A high-performing team member suddenly drops in performance. No explanation given. You:`,
    options:['Issue a performance warning immediately','Reach out personally with genuine concern, create a safe space to share, offer support','Tell HR to handle it','Give them one more week and fire them if no improvement'],
    weights:[1,9,3,0] },
  { id:'EQ24', scale:'emotional_reg',
    text:`During a high-stakes board presentation, you realise you made a significant error in your data. You:`,
    options:['Continue hoping no one notices','Immediately acknowledge the error transparently, commit to correcting it, and move forward with confidence','Stop the presentation and leave','Blame the analyst who prepared the data'],
    weights:[0,9,1,1] },
  { id:'EQ25', scale:'conflict_mgmt',
    text:`Two senior leaders in your organisation have a power struggle affecting your team's work. You:`,
    options:['Pick the more powerful leader\'s side','Remain neutral, focus on your team\'s wellbeing, and address impacts directly with both leaders separately','Do nothing and wait for it to resolve','Escalate to the CEO immediately'],
    weights:[1,9,2,3] },
  { id:'EQ26', scale:'self_motivation',
    text:`You have been passed over for promotion despite excellent performance. A less experienced colleague got it. You:`,
    options:['Resign in frustration','Request a direct, honest conversation with your manager to understand the decision and create a clear development plan','Disengage from work silently','Complain to colleagues constantly'],
    weights:[1,9,3,0] },
  { id:'EQ27', scale:'empathy',
    text:`A client is repeatedly rude and dismissive in meetings despite your best efforts. You:`,
    options:['Match their rudeness','Reflect on whether there are legitimate frustrations driving their behaviour, address those directly, and set professional limits if needed','Refuse to attend further meetings','Tell your manager to assign someone else'],
    weights:[0,9,3,2] },
  { id:'EQ28', scale:'social_skills',
    text:`You need to deliver deeply unpopular news to your entire team (e.g., layoffs, pay cuts). You:`,
    options:['Send an email to avoid the discomfort','Hold a direct, honest, empathetic in-person meeting — explain reasoning, acknowledge impact, answer questions, offer support','Ask HR to do it','Delay the announcement indefinitely'],
    weights:[1,9,2,0] },
  { id:'EQ29', scale:'emotional_reg',
    text:`After months of work, your project is cancelled by leadership due to strategic reasons. You:`,
    options:['Become bitter and disengaged permanently','Allow yourself to grieve the loss, then actively seek meaning in what was learned and pivot with energy','Publicly criticise the decision','Immediately start a new project without processing the loss'],
    weights:[0,9,1,3] },
  { id:'EQ30', scale:'self_awareness',
    text:`You receive 360-degree feedback showing colleagues find you intimidating and unapproachable. You:`,
    options:['Dismiss it — their problem, not yours','Sit with the discomfort, seek specific examples, work with a coach or mentor to understand and change the behaviour','Get defensive and confront the people who gave feedback','Overcorrect and become overly submissive'],
    weights:[0,9,1,2] },
]

// PRO MI — 16 additional (total 40 at Pro)
export const MI_PRO = [
  // Extended Linguistic (4Q)
  { id:'M25', scale:'linguistic',    text:`I enjoy analysing how language shapes thought and culture` },
  { id:'M26', scale:'linguistic',    text:`I can craft persuasive arguments in writing that change people's minds` },
  { id:'M27', scale:'linguistic',    text:`I notice subtle differences in tone and word choice in communication` },
  { id:'M28', scale:'linguistic',    text:`I learn new languages relatively easily compared to others' },
  // Extended Logical-Mathematical (4Q)
  { id:`M29', scale:'logical_math',  text:`I enjoy developing complex algorithms or decision trees` },
  { id:'M30', scale:'logical_math',  text:`I can hold multiple logical arguments in mind simultaneously` },
  { id:'M31', scale:'logical_math',  text:`I find satisfaction in proving something rigorously, not just intuitively` },
  { id:'M32', scale:'logical_math',  text:`I naturally think in systems — inputs, processes, and outputs` },
  // Extended Interpersonal (4Q)
  { id:'M33', scale:'interpersonal', text:`I can read group dynamics and know when to intervene or step back` },
  { id:'M34', scale:'interpersonal', text:`I am effective at building coalitions and aligning different perspectives` },
  { id:'M35', scale:'interpersonal', text:`I can motivate people who have very different values from my own` },
  { id:'M36', scale:'interpersonal', text:`I understand the unspoken power dynamics in any room I enter` },
  // Extended Intrapersonal (4Q)
  { id:'M37', scale:'intrapersonal', text:`I have a detailed understanding of my own emotional triggers and patterns` },
  { id:'M38', scale:'intrapersonal', text:`I can articulate my core values clearly and live by them consistently` },
  { id:'M39', scale:'intrapersonal', text:`I regularly engage in practices like journaling or meditation for self-understanding` },
  { id:'M40', scale:'intrapersonal', text:`I make decisions based on deep self-knowledge rather than external pressure` },
]

// PRO WORK VALUES — 10 additional (total 25 at Pro)
export const VALUES_PRO = [
  { id:'V16', scale:'achievement',   text:`Leaving a lasting legacy that outlives my career` },
  { id:'V17', scale:'independence',  text:`Having complete ownership over my work and its outcomes` },
  { id:'V18', scale:'recognition',   text:`Being considered a thought leader or expert in my field globally` },
  { id:'V19', scale:'relationships', text:`Building deep, long-term professional relationships based on trust` },
  { id:'V20', scale:'support',       text:`Working in an organisation whose mission aligns with my personal values` },
  { id:'V21', scale:'conditions',    text:`Having access to world-class tools, resources, and infrastructure` },
  { id:'V22', scale:'security',      text:`Having full financial independence through my work within 10 years` },
  { id:'V23', scale:'variety',       text:`Working across industries and geographies — no two years the same` },
  { id:'V24', scale:'creativity',    text:`Having the freedom to fundamentally reimagine how things are done` },
  { id:'V25', scale:'lifestyle',     text:`Prioritising personal health, relationships, and wellbeing alongside career` },
]

// PRO LEARNING STYLE — 5 additional (total 15 at Pro)
export const LEARNING_PRO = [
  { id:'L11', scale:'visual',       text:`I create mental maps and diagrams to understand complex information` },
  { id:'L12', scale:'auditory',     text:`I process new ideas best by talking them through with others' },
  { id:`L13', scale:'converger',    text:`I prefer structured frameworks and models to guide my thinking` },
  { id:'L14', scale:'diverger',     text:`I generate better insights when given freedom to explore without constraints` },
  { id:'L15', scale:'assimilator',  text:`I build knowledge by systematically connecting new information to existing frameworks` },
]

// ── QUESTION BANK BY LEVEL ────────────────────────────────────────────────────
// Import base questions from psyQuestions.js and combine

export function getQuestionsForLevel(module, level, baseQuestions, proQuestions) {
  const config = LEVEL_CONFIG[level]
  const count  = config.counts[module] || baseQuestions.length

  if (level === 'starter') {
    return baseQuestions.slice(0, count)
  }
  if (level === 'intermediate') {
    return baseQuestions
  }
  if (level === 'pro') {
    const combined = [...baseQuestions, ...(proQuestions || [])]
    return combined.slice(0, count)
  }
  return baseQuestions
}
