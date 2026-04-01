// CDC PSYCHOMETRIC — Placement Readiness Question Bank
// 63 questions | CSE Branch | Final Year Students
// 4 Sections: Profile, Aptitude, Soft Skills, Career Clarity
// CSE Role Finder is auto-calculated (no questions)

// ── SECTION A: PROFILE SNAPSHOT (10 questions) ────────────────────────────────
// Self-reported, no judgment — just data collection
// Format: MCQ
export const PROFILE_QUESTIONS = [
  { id:'PR1', text:`What is your current CGPA / percentage?`,
    options:['Below 6.0 / 60%','6.0 - 6.9 / 60-69%','7.0 - 7.9 / 70-79%','8.0 - 10.0 / 80%+'],
    scores:[1,2,3,4] },

  { id:'PR2', text:`How many internships have you completed?`,
    options:['None','1 internship','2 internships','3 or more internships'],
    scores:[0,2,3,4] },

  { id:'PR3', text:`What is the duration of your longest internship?`,
    options:['No internship','Less than 1 month','1-3 months','More than 3 months'],
    scores:[0,1,3,4] },

  { id:'PR4', text:`How many technical projects have you built independently?`,
    options:['None','1-2 projects','3-5 projects','6 or more projects'],
    scores:[0,1,3,4] },

  { id:'PR5', text:`Do you have an active GitHub profile with contributions?`,
    options:['No GitHub profile','Profile exists but inactive','Some activity (< 50 commits)','Active profile (50+ commits, public repos)'],
    scores:[0,1,2,4] },

  { id:'PR6', text:`Have you participated in hackathons or coding competitions?`,
    options:['Never','Participated once','Participated 2-3 times','Participated 4+ times or won prizes'],
    scores:[0,1,3,4] },

  { id:'PR7', text:`Which competitive coding platforms are you active on?`,
    options:['None','One platform (casual)','One platform (consistent rating)','Multiple platforms (good ratings on LeetCode/CodeChef/HackerRank)'],
    scores:[0,1,2,4] },

  { id:'PR8', text:`Do you have any industry-recognised certifications?`,
    options:['No certifications','1 online course certificate (Coursera/Udemy)','1-2 industry certifications (AWS/Google/Microsoft)','3+ certifications from recognised providers'],
    scores:[0,1,3,4] },

  { id:'PR9', text:`Have you published any research papers, blogs, or technical articles?`,
    options:['None','Draft/unpublished work','1-2 published blogs or articles','Research paper or 3+ technical publications'],
    scores:[0,1,2,4] },

  { id:'PR10', text:`Have you contributed to open-source projects?`,
    options:['No','Looking into it','Made 1-2 minor contributions','Regular contributor to open-source projects'],
    scores:[0,1,2,4] },
]

// ── SECTION B: WORKPLACE APTITUDE (30 questions, TIMED 20 min) ────────────────
// 70% Reasoning + 30% CS Fundamentals
export const APTITUDE_PLACEMENT_QUESTIONS = [
  // VERBAL REASONING (7Q)
  { id:'WA1',  section:'reasoning', time:45,
    text:`Choose the word that best completes: "The new policy was _____ by all stakeholders, making implementation straightforward."`,
    options:['rejected','contested','embraced','ignored'], correct:2 },

  { id:'WA2',  section:'reasoning', time:45,
    text:`INNOVATION is to STAGNATION as PROGRESS is to:`,
    options:['Development','Regression','Achievement','Success'], correct:1 },

  { id:'WA3',  section:'reasoning', time:45,
    text:`Which sentence is grammatically correct?`,
    options:['Each of the developers have submitted their code.','Each of the developers has submitted their code.','Each of the developer have submitted their code.','Each of the developers have submitted his code.'], correct:1 },

  { id:'WA4',  section:'reasoning', time:45,
    text:`A team leader says: "All good engineers document their code. Rahul is a good engineer." What can be concluded?`,
    options:['Rahul sometimes documents code','Rahul documents his code','All who document are good engineers','Rahul is the best engineer'], correct:1 },

  { id:'WA5',  section:'reasoning', time:45,
    text:`Choose the most appropriate word: "The startup's _____ approach to product development allowed rapid iteration."`,
    options:['rigid','agile','passive','traditional'], correct:1 },

  { id:'WA6',  section:'reasoning', time:60,
    text:`Read: "Remote work has increased productivity for some but decreased it for others. The key variable appears to be whether employees have a dedicated workspace." The passage primarily suggests:`,
    options:['Remote work always improves productivity','Remote work always hurts productivity','Workspace quality affects remote work productivity','Remote work should be banned'], correct:2 },

  { id:'WA7',  section:'reasoning', time:45,
    text:`LATENCY is to NETWORK as FRICTION is to:`,
    options:['Speed','Surface','Movement','Energy'], correct:2 },

  // QUANTITATIVE REASONING (7Q)
  { id:'WA8',  section:'reasoning', time:60,
    text:`A server processes 1000 requests/hour normally. During peak load it slows by 40%. How many requests in 3 peak hours?`,
    options:['1800','1600','2000','1400'], correct:0 },

  { id:'WA9',  section:'reasoning', time:60,
    text:`A startup has 12 developers. Each feature takes 3 days with 2 developers. How many features can be completed in 30 days?`,
    options:['50','60','75','45'], correct:1 },

  { id:'WA10', section:'reasoning', time:60,
    text:`Database size doubles every 8 months. If it's 50GB now, what will it be in 2 years?`,
    options:['200GB','300GB','400GB','150GB'], correct:0 },

  { id:'WA11', section:'reasoning', time:60,
    text:`A bug is found in 1 out of every 200 lines of code. A project has 15,000 lines. Expected bugs:`,
    options:['65','70','75','80'], correct:2 },

  { id:'WA12', section:'reasoning', time:60,
    text:`Cloud storage costs ₹2/GB/month for first 100GB, ₹1.50/GB/month after. Monthly cost for 250GB:`,
    options:['₹400','₹425','₹375','₹450'], correct:1 },

  { id:'WA13', section:'reasoning', time:60,
    text:`Team velocity: Sprint 1=20 points, Sprint 2=22, Sprint 3=24. If trend continues, Sprint 5 total:`,
    options:['26','28','30','32'], correct:1 },

  { id:'WA14', section:'reasoning', time:60,
    text:`3 backend devs can build an API in 6 days. How many days for 2 devs?`,
    options:['8','9','10','7'], correct:1 },

  // LOGICAL REASONING (7Q)
  { id:'WA15', section:'reasoning', time:60,
    text:`In a code review, A reviews B's code, B reviews C's code, C reviews D's code, D reviews A's code. If B finds a critical bug, who is NOT directly involved in fixing it?`,
    options:['A','C','D','B'], correct:1 },

  { id:'WA16', section:'reasoning', time:60,
    text:`System goes DOWN if: CPU > 90% OR Memory > 95% OR Disk > 98%. CPU=88%, Memory=96%, Disk=97%. Status:`,
    options:['Running normally','Down — Memory exceeded','Down — Disk exceeded','Down — CPU exceeded'], correct:1 },

  { id:'WA17', section:'reasoning', time:60,
    text:`API returns error codes: 4xx = client error, 5xx = server error. Response: 404. Meaning:`,
    options:['Server crashed','Resource not found (client error)','Authentication failed','Rate limit exceeded'], correct:1 },

  { id:'WA18', section:'reasoning', time:60,
    text:`Passwords must be: 8+ characters AND have uppercase AND have number AND have special character. "Pass@123" — Valid?`,
    options:['No — too short','No — no special character','Yes — meets all criteria','No — no uppercase'], correct:2 },

  { id:'WA19', section:'reasoning', time:60,
    text:`Git branches: main → develop → feature/login. If feature/login merges to develop, and develop merges to main, which has ALL changes?`,
    options:['feature/login only','develop only','main has all changes','All have same changes'], correct:2 },

  { id:'WA20', section:'reasoning', time:60,
    text:`Find the pattern: GET=Read, POST=Create, PUT=Update, DELETE=?`,
    options:['Archive','Remove','Read','Search'], correct:1 },

  { id:'WA21', section:'reasoning', time:60,
    text:`5 microservices. Each can fail independently with 2% probability. Probability ALL 5 work simultaneously:`,
    options:['90%','90.4%','92%','98%'], correct:1 },

  // CS FUNDAMENTALS (9Q — 30%)
  { id:'CS1',  section:'cs_fundamentals', time:45,
    text:`Which data structure gives O(1) average time for search, insert, and delete?`,
    options:['Array','Linked List','Hash Table','Binary Tree'], correct:2 },

  { id:'CS2',  section:'cs_fundamentals', time:45,
    text:`What is a deadlock in operating systems?`,
    options:['When a process uses 100% CPU','When two or more processes wait for each other indefinitely','When memory is full','When a process crashes'], correct:1 },

  { id:'CS3',  section:'cs_fundamentals', time:45,
    text:`Which SQL command retrieves data without modifying it?`,
    options:['INSERT','UPDATE','SELECT','DELETE'], correct:2 },

  { id:'CS4',  section:'cs_fundamentals', time:45,
    text:`HTTP status code 401 means:`,
    options:['Not Found','Unauthorized (authentication required)','Server Error','Bad Request'], correct:1 },

  { id:'CS5',  section:'cs_fundamentals', time:45,
    text:`What does DNS do?`,
    options:['Encrypts internet traffic','Translates domain names to IP addresses','Manages email routing','Assigns IP addresses dynamically'], correct:1 },

  { id:'CS6',  section:'cs_fundamentals', time:45,
    text:`In OOP, which concept allows a class to inherit properties from another class?`,
    options:['Encapsulation','Polymorphism','Inheritance','Abstraction'], correct:2 },

  { id:'CS7',  section:'cs_fundamentals', time:45,
    text:`What is the time complexity of binary search?`,
    options:['O(n)','O(n²)','O(log n)','O(1)'], correct:2 },

  { id:'CS8',  section:'cs_fundamentals', time:45,
    text:`Which of these is NOT a NoSQL database?`,
    options:['MongoDB','Cassandra','Redis','MySQL'], correct:3 },

  { id:'CS9',  section:'cs_fundamentals', time:45,
    text:`What does REST stand for in web development?`,
    options:['Rapid Execution of Server Tasks','Representational State Transfer','Remote Execution and Storage Technology','Resource Endpoint Structure Transfer'], correct:1 },
]

// ── SECTION C: SOFT SKILLS ASSESSMENT (15 questions) ─────────────────────────
// Situational judgment — workplace scenarios
export const SOFTSKILLS_QUESTIONS = [
  { id:'SS1',  scale:'communication',
    text:`You need to explain a complex technical bug to a non-technical project manager. You:`,
    options:['Use full technical jargon — they should understand','Use an analogy and simple language, avoid jargon','Refuse — it\'s not your job to explain','Send them the error log and let them figure it out'],
    weights:[1,9,0,2] },

  { id:'SS2',  scale:'teamwork',
    text:`Your team member's code is causing repeated failures but they don't realise it. You:`,
    options:['Fix it yourself silently','Privately show them the issue with specific examples and help them fix it','Report it to the manager immediately','Post about it in the team chat publicly'],
    weights:[3,9,2,0] },

  { id:'SS3',  scale:'leadership',
    text:`You are leading a team sprint and a junior dev is consistently missing deadlines. You:`,
    options:['Reassign all their tasks to others','Have a one-on-one to understand blockers, offer support, set clearer expectations','Tell senior management they are not performing','Ignore it and adjust the sprint timeline'],
    weights:[1,9,3,2] },

  { id:'SS4',  scale:'adaptability',
    text:`Mid-project, the client completely changes requirements. Your reaction:`,
    options:['Refuse — changes were not in the original scope','Get frustrated and complain to the team','Assess impact, communicate timeline adjustments professionally, and adapt','Quit the project'],
    weights:[1,2,9,0] },

  { id:'SS5',  scale:'communication',
    text:`In a code review, you find multiple serious issues in a colleague's PR. You:`,
    options:['Reject it harshly with one-word comments like "Wrong" or "Bad"','Approve it to avoid conflict','Leave detailed, respectful, constructive comments with suggestions','Only comment on the most critical issue'],
    weights:[0,1,9,5] },

  { id:'SS6',  scale:'professionalism',
    text:`You disagree strongly with a technical decision made by a senior. You:`,
    options:['Implement it without saying anything','Openly criticise the decision in team meeting aggressively','Raise your concern professionally with data/reasoning in a private conversation first','Refuse to implement it'],
    weights:[2,0,9,1] },

  { id:'SS7',  scale:'teamwork',
    text:`Your team is behind schedule. A teammate asks for help even though you're also busy. You:`,
    options:['Ignore the request — you have your own work','Give 30 minutes to unblock them on the critical issue','Tell them to figure it out','Take over their entire task'],
    weights:[0,9,1,3] },

  { id:'SS8',  scale:'adaptability',
    text:`You are asked to work on a technology stack you have never used. You:`,
    options:['Refuse — you only work with what you know','Say yes, immediately start learning and ask senior devs for guidance','Pretend you know it and struggle silently','Ask for someone else to do it'],
    weights:[0,9,3,1] },

  { id:'SS9',  scale:'leadership',
    text:`Your team has different opinions on architecture. No consensus after 30 mins of discussion. You:`,
    options:['Enforce your own preference','Let the debate continue indefinitely','Propose a time-boxed decision: list pros/cons, vote, commit to the majority decision','Escalate to management immediately'],
    weights:[2,0,9,4] },

  { id:'SS10', scale:'professionalism',
    text:`You made a mistake that caused a production outage. Your response:`,
    options:['Deny responsibility','Immediately inform the team, take ownership, work on a fix, document a post-mortem','Blame the system or another tool','Say nothing and hope no one notices'],
    weights:[0,9,1,0] },

  { id:'SS11', scale:'communication',
    text:`A client is angry about a missed deadline. You:`,
    options:['Avoid their calls','Acknowledge the delay, take responsibility, share a clear recovery plan with timeline','Blame other team members','Promise it will be done "soon" without a specific date'],
    weights:[0,9,1,2] },

  { id:'SS12', scale:'teamwork',
    text:`A team member constantly takes credit for shared work in front of management. You:`,
    options:['Do the same to them','Let it go — it doesn\'t matter','Privately and calmly address it with them first, then escalate if it continues','Complain about it to everyone else'],
    weights:[0,2,9,1] },

  { id:'SS13', scale:'adaptability',
    text:`Your company suddenly shifts to fully remote work. You:`,
    options:['Resist and demand to come to office','Adapt by setting up a proper workspace, maintaining communication, adjusting work style','Perform poorly and blame remote work','Only work the minimum required'],
    weights:[0,9,1,2] },

  { id:'SS14', scale:'leadership',
    text:`You notice a junior dev is consistently doing excellent work that goes unrecognised. You:`,
    options:['Say nothing — recognition is management\'s job','Highlight their contributions in team meetings and to the manager','Take credit for their work instead','Tell them to speak up themselves'],
    weights:[1,9,0,3] },

  { id:'SS15', scale:'professionalism',
    text:`You receive critical feedback on your code from a senior developer. You:`,
    options:['Argue that your approach was correct','Feel personally attacked and get defensive','Thank them, ask clarifying questions, learn from it, and improve','Ignore the feedback'],
    weights:[1,0,9,0] },
]

// ── SECTION D: CAREER CLARITY (8 questions) ───────────────────────────────────
// Understanding student's career direction and priorities
export const CAREER_CLARITY_QUESTIONS = [
  { id:'CC1', text:`Which work environment appeals to you most?`,
    options:['Large MNC with structured career growth','Fast-paced startup with equity potential','Government/PSU with stability and security','Research/Academia — building knowledge'],
    key:'environment' },

  { id:'CC2', text:`What matters most to you in your first job?`,
    options:['Highest possible salary','Learning and skill development','Work-life balance','Impact and meaningful work'],
    key:'priority' },

  { id:'CC3', text:`Where do you see yourself in 5 years?`,
    options:['Senior Engineer / Tech Lead at a company','Founder or Co-founder of a startup','Higher studies completed (M.Tech / MS / MBA / PhD)','Running / joining family business'],
    key:'vision' },

  { id:'CC4', text:`Which type of work excites you most?`,
    options:['Building products used by millions','Solving complex algorithmic problems','Managing and leading teams','Creating innovative new ideas from scratch'],
    key:'work_type' },

  { id:'CC5', text:`How comfortable are you with job insecurity/risk?`,
    options:['I need job security above all','I can handle some risk for better growth','I am comfortable with high risk for high reward','I prefer to create my own security (business)'],
    key:'risk_tolerance' },

  { id:'CC6', text:`Which describes your ideal daily work?`,
    options:['Writing code and solving technical problems','Designing systems and reviewing architecture','Working with people — meetings, stakeholders, clients','Researching, analysing data, finding insights'],
    key:'daily_work' },

  { id:'CC7', text:`If salary were equal, which role would you choose?`,
    options:['Software Engineer at Google','ML Engineer at an AI startup','Product Manager at a unicorn','Researcher at IIT/IISc'],
    key:'role_preference' },

  { id:'CC8', text:`How important is it to you to work on cutting-edge technology?`,
    options:['Not important — I want stable, proven tech','Somewhat important','Very important — I want to work on latest tech','Critical — I want to be building the future'],
    key:'tech_drive' },
]

// ── CSE ROLE DEFINITIONS ──────────────────────────────────────────────────────
// Each role has weights for what matters most
export const CSE_ROLES = [
  {
    id: 'data_science_ml',
    name: 'Data Science / ML / AI',
    icon: '🤖',
    color: '#6366f1',
    description: 'Build machine learning models, analyse data, and develop AI systems',
    psychometric: { riasec: ['investigative','artistic'], bigfive: { openness: 8, conscientiousness: 7 }, aptitude: ['logical_math','abstract'], mi: ['logical_math','intrapersonal'] },
    placement: { aptitude_sections: ['reasoning','cs_fundamentals'], profile_min: 2, clarity_signals: { environment: [0,1], vision: [0,2], work_type: [3], tech_drive: [2,3] } },
    skills: 'Python, Machine Learning, Statistics, SQL, TensorFlow/PyTorch',
    companies: 'Google, Amazon, Microsoft, Flipkart, Razorpay, AI startups',
    salary: '8-30 LPA entry level',
  },
  {
    id: 'backend_engineering',
    name: 'Backend Engineering',
    icon: '⚙️',
    color: '#0ea5e9',
    description: 'Build server-side applications, APIs, databases, and system architecture',
    psychometric: { riasec: ['investigative','conventional'], bigfive: { conscientiousness: 8, openness: 6 }, aptitude: ['logical','infotech'], mi: ['logical_math','spatial'] },
    placement: { aptitude_sections: ['reasoning','cs_fundamentals'], profile_min: 2, clarity_signals: { daily_work: [0,1], work_type: [1] } },
    skills: 'Java/Python/Go/Node.js, SQL/NoSQL, REST APIs, Microservices, Docker',
    companies: 'Amazon, Flipkart, Zomato, Swiggy, Goldman Sachs, JPMorgan',
    salary: '7-25 LPA entry level',
  },
  {
    id: 'frontend_uiux',
    name: 'Frontend / UI-UX Engineering',
    icon: '🎨',
    color: '#f59e0b',
    description: 'Build user interfaces, design systems, and create exceptional user experiences',
    psychometric: { riasec: ['artistic','investigative'], bigfive: { openness: 9, agreeableness: 7 }, aptitude: ['creative','spatial'], mi: ['spatial','linguistic'] },
    placement: { aptitude_sections: ['reasoning'], profile_min: 1, clarity_signals: { work_type: [0,3], daily_work: [0] } },
    skills: 'React/Vue/Angular, HTML/CSS, Figma, JavaScript, TypeScript',
    companies: 'Microsoft, Adobe, Uber, Swiggy, design-led startups',
    salary: '6-22 LPA entry level',
  },
  {
    id: 'fullstack',
    name: 'Full Stack Development',
    icon: '🔧',
    color: '#22c55e',
    description: 'Build end-to-end applications — frontend, backend, and deployment',
    psychometric: { riasec: ['investigative','realistic'], bigfive: { conscientiousness: 7, openness: 7 }, aptitude: ['logical','infotech','creative'], mi: ['logical_math','spatial'] },
    placement: { aptitude_sections: ['reasoning','cs_fundamentals'], profile_min: 3, clarity_signals: { environment: [0,1], work_type: [0,1] } },
    skills: 'React + Node.js/Django, SQL + MongoDB, REST APIs, Git, AWS basics',
    companies: 'Startups, product companies, service companies, freelance',
    salary: '6-20 LPA entry level',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity / Ethical Hacking',
    icon: '🛡️',
    color: '#ef4444',
    description: 'Protect systems and networks from threats, conduct security audits',
    psychometric: { riasec: ['investigative','realistic'], bigfive: { conscientiousness: 9, openness: 7 }, aptitude: ['logical','abstract','perceptual'], mi: ['logical_math','intrapersonal'] },
    placement: { aptitude_sections: ['reasoning','cs_fundamentals'], profile_min: 2, clarity_signals: { tech_drive: [2,3], work_type: [1] } },
    skills: 'Network Security, Penetration Testing, Python, Linux, OWASP, Kali Linux',
    companies: 'ISRO, DRDO, Banks, CERT-In, Palo Alto, CrowdStrike, startups',
    salary: '6-25 LPA entry level',
  },
  {
    id: 'devops_cloud',
    name: 'DevOps / Cloud Engineering',
    icon: '☁️',
    color: '#8b5cf6',
    description: 'Automate deployment pipelines, manage cloud infrastructure, ensure reliability',
    psychometric: { riasec: ['realistic','investigative'], bigfive: { conscientiousness: 9, stability: 8 }, aptitude: ['logical','infotech','mechanical'], mi: ['logical_math','spatial'] },
    placement: { aptitude_sections: ['reasoning','cs_fundamentals'], profile_min: 2, clarity_signals: { daily_work: [0,1], risk_tolerance: [0,1] } },
    skills: 'AWS/GCP/Azure, Docker, Kubernetes, CI/CD, Linux, Terraform',
    companies: 'Amazon, Google, Microsoft, Infosys, TCS, cloud-native startups',
    salary: '7-28 LPA entry level',
  },
  {
    id: 'product_management',
    name: 'Product Management',
    icon: '📊',
    color: '#ec4899',
    description: 'Define product vision, prioritise features, bridge business and engineering',
    psychometric: { riasec: ['enterprising','investigative'], bigfive: { extraversion: 7, openness: 8, conscientiousness: 7 }, aptitude: ['verbal','logical','creative'], mi: ['interpersonal','logical_math','linguistic'] },
    placement: { aptitude_sections: ['reasoning'], profile_min: 2, clarity_signals: { vision: [0], work_type: [2,3], daily_work: [2] } },
    skills: 'Product Strategy, Data Analysis, Wireframing, Stakeholder Management, Agile',
    companies: 'Amazon, Flipkart, Google, Microsoft, unicorn startups (APM programs)',
    salary: '12-35 LPA entry level (APM programs)',
  },
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship / Startup Founder',
    icon: '🚀',
    color: '#f97316',
    description: 'Build your own product or company from scratch',
    psychometric: { riasec: ['enterprising','artistic'], bigfive: { extraversion: 8, openness: 9, stability: 7 }, aptitude: ['creative','abstract','verbal'], mi: ['interpersonal','intrapersonal','logical_math'] },
    placement: { aptitude_sections: ['reasoning'], profile_min: 2, clarity_signals: { vision: [1], environment: [1], risk_tolerance: [2,3], work_type: [3] } },
    skills: 'Problem-solving, Sales, Product Building, Leadership, Networking, Fundraising',
    companies: 'Your own company, IIT/IIM incubators, YC, 100x VC, Sequoia Surge',
    salary: 'Variable — 0 to unlimited',
  },
  {
    id: 'higher_studies',
    name: 'Higher Studies (M.Tech / MS / MBA / PhD)',
    icon: '🎓',
    color: '#14b8a6',
    description: 'Pursue advanced degrees for research, specialisation, or career pivot',
    psychometric: { riasec: ['investigative','social'], bigfive: { openness: 9, conscientiousness: 8 }, aptitude: ['abstract','logical','verbal'], mi: ['logical_math','linguistic','intrapersonal'] },
    placement: { aptitude_sections: ['reasoning','cs_fundamentals'], profile_min: 3, clarity_signals: { vision: [2], environment: [3], work_type: [3], tech_drive: [2,3] } },
    skills: 'Research, Academic Writing, GRE/GATE preparation, Specialised Domain Knowledge',
    companies: 'IITs, IISc, MIT, Stanford, CMU, ETH Zurich (after degree)',
    salary: '10-60 LPA after MS/M.Tech',
  },
  {
    id: 'government_psu',
    name: 'Government / PSU (GATE Route)',
    icon: '🏛️',
    color: '#6b7280',
    description: 'Join public sector organisations through GATE — BHEL, NTPC, ISRO, DRDO',
    psychometric: { riasec: ['conventional','realistic'], bigfive: { conscientiousness: 9, stability: 9 }, aptitude: ['logical','numerical','abstract'], mi: ['logical_math','intrapersonal'] },
    placement: { aptitude_sections: ['reasoning','cs_fundamentals'], profile_min: 2, clarity_signals: { environment: [2], risk_tolerance: [0,1], priority: [2], vision: [0] } },
    skills: 'GATE CSE preparation, Core CS fundamentals, Technical aptitude',
    companies: 'ISRO, DRDO, BHEL, NTPC, HAL, BEL, Indian Railways IT',
    salary: '6-15 LPA + perks + job security',
  },
  {
    id: 'it_consulting',
    name: 'IT Consulting / Business Analyst',
    icon: '💼',
    color: '#0891b2',
    description: 'Help businesses improve processes using technology and data insights',
    psychometric: { riasec: ['enterprising','social','conventional'], bigfive: { extraversion: 7, agreeableness: 7, conscientiousness: 8 }, aptitude: ['verbal','logical','numerical'], mi: ['interpersonal','linguistic','logical_math'] },
    placement: { aptitude_sections: ['reasoning'], profile_min: 1, clarity_signals: { daily_work: [2], work_type: [2], environment: [0] } },
    skills: 'Problem-solving, Excel/SQL, PowerPoint, Business Analysis, Communication',
    companies: 'TCS, Infosys, Wipro, Accenture, Deloitte, McKinsey, BCG (after MBA)',
    salary: '4-15 LPA entry level',
  },
  {
    id: 'family_business',
    name: 'Family Business (Tech-enabled)',
    icon: '🏢',
    color: '#a16207',
    description: 'Bring technology expertise to modernise and grow family business',
    psychometric: { riasec: ['enterprising','conventional'], bigfive: { conscientiousness: 8, agreeableness: 8 }, aptitude: ['numerical','logical','verbal'], mi: ['interpersonal','logical_math'] },
    placement: { aptitude_sections: ['reasoning'], profile_min: 1, clarity_signals: { vision: [3], environment: [1,2], risk_tolerance: [1,3] } },
    skills: 'Business Operations, Digital Marketing, ERP Systems, Financial Management',
    companies: 'Family business (tech transformation)',
    salary: 'Variable based on business',
  },
]

export const PLACEMENT_MODULE_INFO = {
  profile:    { label:`Profile Snapshot`,    icon:'👤', color:'#6366f1', duration:'5 min',  questions: PROFILE_QUESTIONS },
  aptitude:   { label:`Workplace Aptitude`,  icon:'⚡', color:'#ef4444', duration:'20 min', questions: APTITUDE_PLACEMENT_QUESTIONS },
  softskills: { label:`Soft Skills`,         icon:'🤝', color:'#22c55e', duration:'8 min',  questions: SOFTSKILLS_QUESTIONS },
  clarity:    { label:`Career Clarity`,      icon:'🎯', color:'#f59e0b', duration:'5 min',  questions: CAREER_CLARITY_QUESTIONS },
  rolefinder: { label:`CSE Role Finder`,     icon:'🔍', color:'#8b5cf6', duration:'auto',   questions: [] },
}
