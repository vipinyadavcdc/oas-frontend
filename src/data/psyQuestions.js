// CDC PSYCHOMETRIC — Complete Question Bank
// 7+1 Dimensions | 208 Questions Total
// All public domain (IPIP, Holland's original, Gardner's model)

// ── DIMENSION 1: ORIENTATION / RIASEC (48 questions) ─────────────────────────
// Format: Like(5) / Somewhat Like(4) / Neutral(3) / Somewhat Unlike(2) / Unlike(1)
export const ORIENTATION_QUESTIONS = [
  // REALISTIC (R) — hands-on, tools, physical
  { id:'O1',  scale:'realistic',     text:`Work on cars, trucks, or motorcycles` },
  { id:'O2',  scale:'realistic',     text:`Use hand tools to repair or build things` },
  { id:'O3',  scale:'realistic',     text:`Operate machinery or heavy equipment` },
  { id:'O4',  scale:'realistic',     text:`Work outdoors on construction projects` },
  { id:'O5',  scale:'realistic',     text:`Fix electrical wiring in buildings` },
  { id:'O6',  scale:'realistic',     text:`Work with animals on a farm or ranch` },
  { id:'O7',  scale:'realistic',     text:`Read a blueprint or technical diagram` },
  { id:'O8',  scale:'realistic',     text:`Assemble electronic or mechanical parts` },
  // INVESTIGATIVE (I) — analytical, curious, scientific
  { id:'O9',  scale:'investigative', text:`Study how the human body works` },
  { id:'O10', scale:'investigative', text:`Conduct chemistry or biology experiments` },
  { id:'O11', scale:'investigative', text:`Read scientific or technical journals` },
  { id:'O12', scale:'investigative', text:`Analyse data using mathematical models` },
  { id:'O13', scale:'investigative', text:`Write computer programs to solve problems` },
  { id:'O14', scale:'investigative', text:`Study causes of diseases and find cures` },
  { id:'O15', scale:'investigative', text:`Develop new theories in physics or maths` },
  { id:'O16', scale:'investigative', text:`Research financial markets and trends` },
  // ARTISTIC (A) — creative, expressive, aesthetic
  { id:'O17', scale:'artistic',      text:`Create original paintings or drawings` },
  { id:'O18', scale:'artistic',      text:`Write short stories, poems, or novels` },
  { id:'O19', scale:'artistic',      text:`Perform music on a stage or in a band` },
  { id:'O20', scale:'artistic',      text:`Design costumes, sets, or visual effects` },
  { id:'O21', scale:'artistic',      text:`Direct or act in a film or theatre` },
  { id:'O22', scale:'artistic',      text:`Design websites, apps, or logos` },
  { id:'O23', scale:'artistic',      text:`Create advertising campaigns or brand identities` },
  { id:'O24', scale:'artistic',      text:`Develop innovative interior design concepts` },
  // SOCIAL (S) — helpful, caring, people-oriented
  { id:'O25', scale:'social',        text:`Teach children in a classroom setting` },
  { id:'O26', scale:'social',        text:`Counsel individuals through personal problems` },
  { id:'O27', scale:'social',        text:`Work in a hospital or clinic helping patients` },
  { id:'O28', scale:'social',        text:`Coach a sports team or mentor young people` },
  { id:'O29', scale:'social',        text:`Lead community service or volunteer programs` },
  { id:'O30', scale:'social',        text:`Work as a social worker helping families` },
  { id:'O31', scale:'social',        text:`Organise workshops or training programs` },
  { id:'O32', scale:'social',        text:`Help mediate or resolve conflicts between people` },
  // ENTERPRISING (E) — leadership, persuasion, business
  { id:'O33', scale:'enterprising',  text:`Start and run your own business` },
  { id:'O34', scale:'enterprising',  text:`Persuade others to adopt your ideas` },
  { id:'O35', scale:'enterprising',  text:`Give presentations to large groups` },
  { id:'O36', scale:'enterprising',  text:`Negotiate contracts or business deals` },
  { id:'O37', scale:'enterprising',  text:`Lead a team toward achieving goals` },
  { id:'O38', scale:'enterprising',  text:`Develop and manage a marketing campaign` },
  { id:'O39', scale:'enterprising',  text:`Make important financial decisions for a company` },
  { id:'O40', scale:'enterprising',  text:`Recruit, hire, and manage employees` },
  // CONVENTIONAL (C) — organised, data, structured
  { id:'O41', scale:'conventional',  text:`Keep detailed financial records and accounts` },
  { id:'O42', scale:'conventional',  text:`Manage files, records, and databases` },
  { id:'O43', scale:'conventional',  text:`Work with spreadsheets and financial statements` },
  { id:'O44', scale:'conventional',  text:`Follow specific procedures and guidelines` },
  { id:'O45', scale:'conventional',  text:`Proofread documents for errors` },
  { id:'O46', scale:'conventional',  text:`Schedule appointments and coordinate logistics` },
  { id:'O47', scale:'conventional',  text:`Process forms, invoices, and financial transactions` },
  { id:'O48', scale:'conventional',  text:`Organise inventory and maintain accurate counts` },
]

// ── DIMENSION 2: PERSONALITY — BIG FIVE (50 questions, IPIP public domain) ────
// Format: 1=Very Inaccurate, 2=Inaccurate, 3=Neutral, 4=Accurate, 5=Very Accurate
export const PERSONALITY_QUESTIONS = [
  // OPENNESS (O) — curiosity, creativity, experience
  { id:'P1',  scale:'openness',          reverse:false, text:`I have a rich vocabulary and enjoy wordplay` },
  { id:'P2',  scale:'openness',          reverse:false, text:`I have a vivid imagination and enjoy fantasy` },
  { id:'P3',  scale:'openness',          reverse:false, text:`I enjoy hearing new ideas and theories` },
  { id:'P4',  scale:'openness',          reverse:true,  text:`I tend to avoid philosophical discussions` },
  { id:'P5',  scale:'openness',          reverse:false, text:`I enjoy visiting art galleries and museums` },
  { id:'P6',  scale:'openness',          reverse:false, text:`I am easily captivated by different cultures` },
  { id:'P7',  scale:'openness',          reverse:false, text:`I enjoy thinking about abstract concepts` },
  { id:'P8',  scale:'openness',          reverse:false, text:`I often get lost in thought and reflection` },
  { id:'P9',  scale:'openness',          reverse:false, text:`I am quick to understand new ideas` },
  { id:'P10', scale:'openness',          reverse:false, text:`I use complex sentences and vocabulary naturally` },
  // CONSCIENTIOUSNESS (C) — organised, disciplined, goal-driven
  { id:'P11', scale:'conscientiousness', reverse:false, text:`I am always prepared and plan things carefully` },
  { id:'P12', scale:'conscientiousness', reverse:false, text:`I pay attention to details in everything I do` },
  { id:'P13', scale:'conscientiousness', reverse:false, text:`I get chores done right away without delay` },
  { id:'P14', scale:'conscientiousness', reverse:false, text:`I carry out my plans and follow through completely` },
  { id:'P15', scale:'conscientiousness', reverse:true,  text:`I often leave my belongings scattered around` },
  { id:'P16', scale:'conscientiousness', reverse:false, text:`I like order and keep things organised at all times` },
  { id:'P17', scale:'conscientiousness', reverse:false, text:`I set high standards for myself and work hard to meet them` },
  { id:'P18', scale:'conscientiousness', reverse:false, text:`I follow rules and regulations carefully` },
  { id:'P19', scale:'conscientiousness', reverse:true,  text:`I sometimes waste my time on unimportant things` },
  { id:'P20', scale:'conscientiousness', reverse:false, text:`I am very precise and exact in my work` },
  // EXTRAVERSION (E) — sociable, assertive, energetic
  { id:'P21', scale:'extraversion',      reverse:false, text:`I am the life of the party and enjoy socialising` },
  { id:'P22', scale:'extraversion',      reverse:false, text:`I feel comfortable around people I have just met` },
  { id:'P23', scale:'extraversion',      reverse:false, text:`I start conversations with strangers easily` },
  { id:'P24', scale:'extraversion',      reverse:true,  text:`I prefer to be alone rather than in a group` },
  { id:'P25', scale:'extraversion',      reverse:false, text:`I don't mind being the centre of attention` },
  { id:'P26', scale:'extraversion',      reverse:false, text:`I talk to many different people at social events` },
  { id:'P27', scale:'extraversion',      reverse:false, text:`I am energised by spending time with people` },
  { id:'P28', scale:'extraversion',      reverse:true,  text:`I find it hard to approach others first` },
  { id:'P29', scale:'extraversion',      reverse:false, text:`I am enthusiastic and expressive in conversations` },
  { id:'P30', scale:'extraversion',      reverse:false, text:`I find making new friends comes naturally to me` },
  // AGREEABLENESS (A) — cooperative, empathetic, trusting
  { id:'P31', scale:'agreeableness',     reverse:false, text:`I feel others' emotions deeply and empathise easily` },
  { id:'P32', scale:'agreeableness',     reverse:false, text:`I have a soft heart and care about others' feelings` },
  { id:'P33', scale:'agreeableness',     reverse:false, text:`I take time out for others who are struggling` },
  { id:'P34', scale:'agreeableness',     reverse:true,  text:`I am not particularly interested in others' problems` },
  { id:'P35', scale:'agreeableness',     reverse:false, text:`I make people feel at ease and welcome` },
  { id:'P36', scale:'agreeableness',     reverse:false, text:`I am interested in and curious about other people` },
  { id:'P37', scale:'agreeableness',     reverse:false, text:`I love to help others, even at personal cost` },
  { id:'P38', scale:'agreeableness',     reverse:true,  text:`I sometimes hold grudges and find it hard to forgive` },
  { id:'P39', scale:'agreeableness',     reverse:false, text:`I believe in treating all people with equal respect` },
  { id:'P40', scale:'agreeableness',     reverse:false, text:`I avoid arguments and prefer peaceful solutions` },
  // EMOTIONAL STABILITY (N) — calm, resilient, even-tempered
  { id:'P41', scale:'stability',         reverse:false, text:`I remain calm and collected in tense situations` },
  { id:'P42', scale:'stability',         reverse:false, text:`I seldom feel blue, anxious, or down` },
  { id:'P43', scale:'stability',         reverse:false, text:`I am relaxed and handle stress well` },
  { id:'P44', scale:'stability',         reverse:true,  text:`I get irritated easily by small inconveniences` },
  { id:'P45', scale:'stability',         reverse:false, text:`I am not easily disturbed by events around me` },
  { id:'P46', scale:'stability',         reverse:false, text:`I recover quickly from setbacks and disappointments` },
  { id:'P47', scale:'stability',         reverse:false, text:`I feel emotionally secure and stable most of the time` },
  { id:'P48', scale:'stability',         reverse:true,  text:`I sometimes feel overwhelmed by my emotions` },
  { id:'P49', scale:'stability',         reverse:false, text:`I rarely worry unnecessarily about things` },
  { id:'P50', scale:'stability',         reverse:false, text:`I keep a cool head even when things go wrong` },
]

// ── DIMENSION 3: INTEREST MAPPING (25 questions) ─────────────────────────────
// Format: 1=No Interest to 5=Very Strong Interest
export const INTEREST_QUESTIONS = [
  { id:'I1',  scale:'engineering_tech',  text:`Designing, building, or programming technology systems` },
  { id:'I2',  scale:'data_ai',           text:`Working with data, statistics, AI, and machine learning` },
  { id:'I3',  scale:'healthcare_med',    text:`Studying medicine, health sciences, or patient care` },
  { id:'I4',  scale:'business_mgmt',     text:`Running a business, managing teams, or entrepreneurship` },
  { id:'I5',  scale:'creative_arts',     text:`Creating visual art, music, writing, or design work` },
  { id:'I6',  scale:'law_justice',       text:`Law, justice, advocacy, or public policy` },
  { id:'I7',  scale:'education',         text:`Teaching, mentoring, or developing training programs` },
  { id:'I8',  scale:'finance_banking',   text:`Finance, investment, banking, or economics` },
  { id:'I9',  scale:'environment',       text:`Environmental science, sustainability, or conservation` },
  { id:'I10', scale:'media_comm',        text:`Journalism, media, communications, or public relations` },
  { id:'I11', scale:'social_service',    text:`Social work, counseling, or community service` },
  { id:'I12', scale:'sports_fitness',    text:`Sports coaching, fitness training, or physical education` },
  { id:'I13', scale:'hospitality',       text:`Hospitality, tourism, hotel management, or culinary arts` },
  { id:'I14', scale:'defense_security',  text:`Defense services, law enforcement, or cybersecurity` },
  { id:'I15', scale:'research_science',  text:`Scientific research, laboratory work, or academia` },
  { id:'I16', scale:'architecture',      text:`Architecture, urban planning, or civil engineering` },
  { id:'I17', scale:'fashion_textile',   text:`Fashion design, textile, or apparel industry` },
  { id:'I18', scale:'aviation_space',    text:`Aviation, aerospace engineering, or space exploration` },
  { id:'I19', scale:'psychology',        text:`Psychology, mental health, or behavioural science` },
  { id:'I20', scale:'agriculture',       text:`Agriculture, food science, or rural development` },
  { id:'I21', scale:'engineering_tech',  text:`Solving complex technical or engineering problems` },
  { id:'I22', scale:'data_ai',           text:`Building predictive models or analysing large datasets` },
  { id:'I23', scale:'business_mgmt',     text:`Negotiating deals, managing projects, or leading change` },
  { id:'I24', scale:'creative_arts',     text:`Developing creative content for brands or audiences` },
  { id:'I25', scale:'research_science',  text:`Reading scientific literature and conducting experiments` },
]

// ── DIMENSION 4: APTITUDE (50 questions, TIMED 25 minutes) ───────────────────
// Format: MCQ with 4 options (A=0, B=1, C=2, D=3)
export const APTITUDE_QUESTIONS = [
  // ABSTRACT REASONING (5Q)
  { id:'A1',  scale:'abstract',    time:60, text:`What comes next in the series: 2, 6, 12, 20, 30, ?`, options:['42','44','40','36'], correct:0 },
  { id:'A2',  scale:'abstract',    time:60, text:`Which number completes the pattern: 1, 4, 9, 16, 25, ?`, options:['30','36','49','34'], correct:1 },
  { id:'A3',  scale:'abstract',    time:60, text:`Find the odd one out: 121, 144, 169, 196, 214`, options:['121','144','214','196'], correct:2 },
  { id:'A4',  scale:'abstract',    time:60, text:`What is next: Z, X, V, T, R, ?`, options:['Q','P','O','S'], correct:1 },
  { id:'A5',  scale:'abstract',    time:60, text:`Complete: 3, 6, 11, 18, 27, ?`, options:['36','38','40','35'], correct:1 },
  // VERBAL REASONING (5Q)
  { id:'A6',  scale:'verbal',      time:45, text:`BOOK is to LIBRARY as PAINTING is to:`, options:['Artist','Gallery','Canvas','Museum'], correct:3 },
  { id:'A7',  scale:'verbal',      time:45, text:`Choose the word most similar in meaning to EPHEMERAL:`, options:['Permanent','Temporary','Ancient','Eternal'], correct:1 },
  { id:'A8',  scale:'verbal',      time:45, text:`Which word is the antonym of BENEVOLENT?`, options:['Kind','Generous','Malevolent','Gentle'], correct:2 },
  { id:'A9',  scale:'verbal',      time:45, text:`Complete: "A _____ of lions, a _____ of fish"`, options:['pack/school','pride/school','herd/flock','pride/pod'], correct:1 },
  { id:'A10', scale:'verbal',      time:45, text:`If all Glaps are Frems, and some Frems are Trems, then:`, options:['All Glaps are Trems','Some Glaps may be Trems','No Glaps are Trems','All Trems are Glaps'], correct:1 },
  // LOGICAL REASONING (5Q)
  { id:'A11', scale:'logical',     time:60, text:`If A > B, B > C, C > D, which is definitely true?`, options:['D > A','A > D','B > D','C > A'], correct:2 },
  { id:'A12', scale:'logical',     time:60, text:`In a row of 5 people, A is to the right of B and left of C. D is between B and A. Who is leftmost?`, options:['A','B','C','D'], correct:1 },
  { id:'A13', scale:'logical',     time:60, text:`All roses are flowers. Some flowers fade quickly. Therefore:`, options:['All roses fade quickly','Some roses may fade quickly','No roses fade quickly','Roses are not flowers'], correct:1 },
  { id:'A14', scale:'logical',     time:60, text:`If COMPUTER = 87, and MOBILE = 58, what is LAPTOP?`, options:['68','72','65','70'], correct:0 },
  { id:'A15', scale:'logical',     time:60, text:`Pointing to a man, a woman says: "His father is the only son of my father." The woman is his:`, options:['Mother','Aunt','Sister','Grandmother'], correct:0 },
  // NUMERICAL REASONING (5Q)
  { id:'A16', scale:'numerical',   time:60, text:`A train travels 360 km in 4 hours. At the same speed, how far will it travel in 6.5 hours?`, options:['540 km','585 km','620 km','560 km'], correct:1 },
  { id:'A17', scale:'numerical',   time:60, text:`If 8 workers complete a job in 12 days, how many days will 6 workers take?`, options:['14 days','16 days','18 days','10 days'], correct:1 },
  { id:'A18', scale:'numerical',   time:60, text:`What is 15% of 840?`, options:['112','126','120','135'], correct:1 },
  { id:'A19', scale:'numerical',   time:60, text:`A shirt costs ₹800 after 20% discount. What was the original price?`, options:['₹960','₹1000','₹1050','₹900'], correct:1 },
  { id:'A20', scale:'numerical',   time:60, text:`Simple interest on ₹5000 at 8% per annum for 3 years:`, options:['₹1000','₹1200','₹1500','₹800'], correct:1 },
  // SPATIAL REASONING (5Q)
  { id:'A21', scale:'spatial',     time:60, text:`A cube has 6 faces. If painted red on all faces and cut into 27 equal cubes, how many have exactly 2 red faces?`, options:['8','12','6','4'], correct:1 },
  { id:'A22', scale:'spatial',     time:60, text:`How many squares are in a 4×4 grid?`, options:['16','20','30','24'], correct:2 },
  { id:'A23', scale:'spatial',     time:60, text:`A clock reads 3:25. What angle is between the hour and minute hands?`, options:['37.5°','47.5°','42.5°','32.5°'], correct:1 },
  { id:'A24', scale:'spatial',     time:60, text:`If you fold a paper square diagonally twice then cut the corner, what shape appears when unfolded?`, options:['Triangle','Square','Circle','Diamond with hole'], correct:3 },
  { id:'A25', scale:'spatial',     time:60, text:`Which 3D shape has 6 faces, 12 edges, and 8 vertices?`, options:['Cylinder','Sphere','Cube','Pyramid'], correct:2 },
  // LANGUAGE USAGE (5Q)
  { id:'A26', scale:'language',    time:45, text:`Choose the correctly punctuated sentence:`, options:["It's their problem, not ours.",'Its there problem, not ours.','Its their problem, not our\'s.',"It's there problem not ours."], correct:0 },
  { id:'A27', scale:'language',    time:45, text:`Which word is spelled correctly?`, options:['Accomodation','Acommodation','Accommodation','Acomodation'], correct:2 },
  { id:'A28', scale:'language',    time:45, text:`Choose the grammatically correct sentence:`, options:['Between you and I, this is wrong.','Between you and me, this is wrong.','Between I and you, this is wrong.','Between you and myself, this is wrong.'], correct:1 },
  { id:'A29', scale:'language',    time:45, text:`The passive voice of "The teacher praised the student" is:`, options:['The student praised the teacher.','The student was praised by the teacher.','The teacher was praised by the student.','The student has been praised.'], correct:1 },
  { id:'A30', scale:'language',    time:45, text:`Which sentence uses the word "affect" correctly?`, options:['The rain will effect our plans.','The new law will affect everyone.','We need to affect changes immediately.','The drug had no affect on him.'], correct:1 },
  // INFO TECH (5Q)
  { id:'A31', scale:'infotech',    time:45, text:`Which of these is NOT a programming language?`, options:['Python','Java','Photoshop','Swift'], correct:2 },
  { id:'A32', scale:'infotech',    time:45, text:`What does "URL" stand for?`, options:['Universal Resource Locator','Uniform Resource Locator','Universal Record Link','Uniform Record Locator'], correct:1 },
  { id:'A33', scale:'infotech',    time:45, text:`Which data structure operates on LIFO principle?`, options:['Queue','Stack','Array','Tree'], correct:1 },
  { id:'A34', scale:'infotech',    time:45, text:`What is the binary equivalent of decimal 13?`, options:['1010','1101','1110','1001'], correct:1 },
  { id:'A35', scale:'infotech',    time:45, text:`Which of these is a cloud computing platform?`, options:['Microsoft Word','AWS','Photoshop','VLC'], correct:1 },
  // MECHANICAL (5Q)
  { id:'A36', scale:'mechanical',  time:60, text:`If a gear with 20 teeth meshes with a gear of 40 teeth, the larger gear rotates at:`, options:['Same speed','Half the speed','Double the speed','Quarter speed'], correct:1 },
  { id:'A37', scale:'mechanical',  time:60, text:`Which simple machine is a wheel and axle?`, options:['Scissors','Screwdriver','Crowbar','Ramp'], correct:1 },
  { id:'A38', scale:'mechanical',  time:60, text:`Water flows faster through a narrow pipe because of:`, options:['Boyle\'s Law','Bernoulli\'s Principle','Newton\'s Law','Archimedes\'s Principle'], correct:1 },
  { id:'A39', scale:'mechanical',  time:60, text:`A lever has effort arm 4m and load arm 1m. If the load is 100N, the effort required is:`, options:['400N','25N','100N','50N'], correct:1 },
  { id:'A40', scale:'mechanical',  time:60, text:`Which material expands the most when heated?`, options:['Steel','Glass','Copper','Rubber'], correct:2 },
  // PERCEPTUAL SPEED (5Q)
  { id:'A41', scale:'perceptual',  time:30, text:`How many times does the letter "a" appear: "A banana salad has many banana flavours in a tasty banana way"`, options:['8','9','10','11'], correct:1 },
  { id:'A42', scale:'perceptual',  time:30, text:`Find the pair that is NOT identical: AB-BA, CD-CD, EF-EF, GH-GH`, options:['AB-BA','CD-CD','EF-EF','GH-GH'], correct:0 },
  { id:'A43', scale:'perceptual',  time:30, text:`Which number is different: 9834, 9834, 9834, 9384, 9834`, options:['First','Second','Fourth','Fifth'], correct:2 },
  { id:'A44', scale:'perceptual',  time:30, text:`Count the triangles in a Star of David (6-pointed star):`, options:['6','8','10','12'], correct:1 },
  { id:'A45', scale:'perceptual',  time:30, text:`Spot the different item: ☆☆☆☆★☆☆☆`, options:['3rd','5th','6th','2nd'], correct:1 },
  // CREATIVE THINKING (5Q)
  { id:'A46', scale:'creative',    time:60, text:`A brick has how many unusual uses? Choose the most creative answer:`, options:['1-3 uses','4-8 uses','9-15 uses','16+ uses (book holder, garden border, art canvas, doorstop, weapon, weight, step, paint stamp...)'], correct:3 },
  { id:'A47', scale:'creative',    time:60, text:`What connects these words: SPRING, FALL, WINTER, BOX`, options:['Weather','Seasons','JUMP (Spring/Jump, Waterfall, Winter/Jump, Boxspring)','Gymnastics'], correct:2 },
  { id:'A48', scale:'creative',    time:60, text:`A company loses 30% revenue. A creative solution is:`, options:['Cut all staff','Increase prices only','Diversify products, enter new markets, partner with competitors','Do nothing and wait'], correct:2 },
  { id:'A49', scale:'creative',    time:60, text:`Which approach best solves: "Students are bored in class"?`, options:['Stricter discipline','Gamify learning with challenges and real-world projects','Longer homework','More tests'], correct:1 },
  { id:'A50', scale:'creative',    time:60, text:`You have only a paperclip, rubber band, and matchstick. Best survival use:`, options:['No real use','Build a fire starter with match, use rubber band as slingshot, use paperclip as hook','Decoration','Give up'], correct:1 },
]

// ── DIMENSION 5: EMOTIONAL INTELLIGENCE (20 questions) ───────────────────────
// Situational Judgment — choose the BEST response (weighted scoring)
export const EQ_QUESTIONS = [
  { id:'EQ1',  scale:'empathy',          text:`Your close friend is crying after failing an exam. You:`,
    options:['Tell them to toughen up, it\'s not a big deal','Sit with them, listen without judgment, then offer support','Immediately give advice on how to study better','Change the subject to cheer them up'],
    weights:[0,9,3,5] },
  { id:'EQ2',  scale:'conflict_mgmt',    text:`Two teammates have a serious argument affecting the project. You:`,
    options:['Ignore it and hope it resolves itself','Privately speak to each person, understand both sides, then mediate','Pick the side you agree with','Report it to your manager immediately'],
    weights:[0,9,1,4] },
  { id:'EQ3',  scale:'self_awareness',   text:`You receive harsh critical feedback from your supervisor. You:`,
    options:['Get defensive and explain why you were right','Feel upset but reflect on it later to extract value','Immediately apologise for everything','Ask a colleague to validate your original approach'],
    weights:[1,9,3,5] },
  { id:'EQ4',  scale:'emotional_reg',    text:`You feel very angry after an unfair decision at work. You:`,
    options:['Confront the person immediately with full emotion','Take a walk, calm down, then address it professionally','Complain to everyone about how unfair it is','Bottle it up and say nothing'],
    weights:[1,9,2,3] },
  { id:'EQ5',  scale:'empathy',          text:`A new colleague seems very nervous and isolated on their first day. You:`,
    options:['Wait — they will settle in on their own','Introduce yourself, include them in conversation, make them feel welcome','Tell your manager the new person seems antisocial','Focus on your own work, you have enough to do'],
    weights:[2,9,0,1] },
  { id:'EQ6',  scale:'self_motivation',  text:`You're working on a long, difficult project with no immediate reward. You:`,
    options:['Give up — there\'s no point if there\'s no reward','Break it into small goals, celebrate mini-milestones','Rush through it just to finish','Wait for someone else to take over'],
    weights:[0,9,3,1] },
  { id:'EQ7',  scale:'social_skills',    text:`You need to persuade your team to adopt a new idea they're resistant to. You:`,
    options:['Force the change — you know it\'s better','Understand their concerns, address each one, pilot it small first','Present data and leave the decision to them','Accept defeat and drop the idea'],
    weights:[2,9,5,0] },
  { id:'EQ8',  scale:'emotional_reg',    text:`Before an important presentation, you feel extremely anxious. You:`,
    options:['Avoid thinking about it and hope for the best','Use deep breathing, visualise success, reframe anxiety as excitement','Tell everyone you are terrible at presentations','Cancel the presentation'],
    weights:[1,9,3,0] },
  { id:'EQ9',  scale:'self_awareness',   text:`You notice a pattern where you always procrastinate on one type of task. You:`,
    options:['Continue the same pattern — it works eventually','Reflect on why, identify the emotional block, create a strategy to overcome it','Blame external circumstances','Ask someone to always do that task for you'],
    weights:[1,9,3,0] },
  { id:'EQ10', scale:'empathy',          text:`Your manager gives you less credit than deserved in a meeting. You:`,
    options:['Make a scene in the meeting immediately','Speak privately with your manager afterwards, calmly explaining your contribution','Say nothing and harbour resentment','Complain loudly to colleagues'],
    weights:[1,9,3,0] },
  { id:'EQ11', scale:'conflict_mgmt',    text:`You receive unfair criticism in front of the whole team. You:`,
    options:['Argue back immediately in front of everyone','Stay composed, acknowledge the concern, then request a private discussion later','Break down emotionally','Remain silent but never forgive the person'],
    weights:[2,9,0,1] },
  { id:'EQ12', scale:'social_skills',    text:`You sense a colleague is overwhelmed but hasn't said anything. You:`,
    options:['Do nothing — it\'s not your place','Gently check in: "I noticed you seem busy — is there anything I can help with?"','Tell others your colleague can\'t cope','Wait until they ask for help themselves'],
    weights:[0,9,1,3] },
  { id:'EQ13', scale:'self_motivation',  text:`You fail at something you worked very hard on. You:`,
    options:['Give up entirely on that goal','Take time to process, analyse what went wrong, and try a better approach','Blame others for the failure','Pretend it never happened'],
    weights:[0,9,1,2] },
  { id:'EQ14', scale:'emotional_reg',    text:`Someone is being rude and dismissive towards you repeatedly. You:`,
    options:['Be equally rude back','Stay calm, set a clear professional boundary, then disengage if it continues','Cry about it privately','Tell everyone what a terrible person they are'],
    weights:[1,9,3,0] },
  { id:'EQ15', scale:'empathy',          text:`A team member makes a costly mistake. The team is frustrated. You:`,
    options:['Join in criticising them','Defend them to the team and privately support them to learn from it','Stay neutral and say nothing','Report the mistake to management'],
    weights:[0,9,3,4] },
  { id:'EQ16', scale:'self_awareness',   text:`You're asked for honest feedback about a friend's work, which you think is poor. You:`,
    options:['Tell them everything is great to avoid conflict','Kindly but honestly share specific feedback with suggestions for improvement','Avoid the question entirely','Ask someone else to give the feedback'],
    weights:[0,9,1,2] },
  { id:'EQ17', scale:'social_skills',    text:`You are leading a diverse team with conflicting communication styles. You:`,
    options:['Ask everyone to adapt to your style','Learn each person\'s communication style and flex your approach for each','Send everything in writing and avoid direct conversations','Let each person work independently'],
    weights:[1,9,3,2] },
  { id:'EQ18', scale:'self_motivation',  text:`You are doing repetitive work that feels meaningless. You:`,
    options:['Do only the minimum required','Find personal meaning in it (mastery, helping others) or improve the process itself','Quit the job','Complain constantly about how boring it is'],
    weights:[2,9,0,1] },
  { id:'EQ19', scale:'conflict_mgmt',    text:`Two departments have conflicting priorities affecting your work. You:`,
    options:['Pick one side and ignore the other','Facilitate a joint conversation to align on shared goals','Escalate to senior management immediately','Work around the conflict on your own'],
    weights:[1,9,3,4] },
  { id:'EQ20', scale:'emotional_reg',    text:`You feel deeply disappointed when your excellent idea is rejected. You:`,
    options:['Refuse to contribute ideas in the future','Process the disappointment, seek feedback on why, refine and try again','Argue that the decision-makers are incompetent','Pretend you don\'t care at all'],
    weights:[0,9,1,3] },
]

// ── DIMENSION 6: MULTIPLE INTELLIGENCES (24 questions) ───────────────────────
// Format: 3=Yes/Often, 2=Sometimes, 1=No/Rarely
export const MI_QUESTIONS = [
  // LINGUISTIC
  { id:'M1',  scale:'linguistic',     text:`I remember things better when I write them down` },
  { id:'M2',  scale:'linguistic',     text:`I enjoy reading books, articles, or poetry for pleasure` },
  { id:'M3',  scale:'linguistic',     text:`I can express my ideas clearly in writing` },
  // LOGICAL-MATHEMATICAL
  { id:'M4',  scale:'logical_math',   text:`I enjoy solving puzzles, riddles, or brain teasers` },
  { id:'M5',  scale:'logical_math',   text:`I like to find patterns and logical connections in information` },
  { id:'M6',  scale:'logical_math',   text:`I'm comfortable working with numbers and calculations` },
  // SPATIAL
  { id:'M7',  scale:'spatial',        text:`I can easily visualise how objects look from different angles` },
  { id:'M8',  scale:'spatial',        text:`I enjoy drawing, sketching, or creating visual designs` },
  { id:'M9',  scale:'spatial',        text:`I am good at reading maps and navigating new places` },
  // MUSICAL
  { id:'M10', scale:'musical',        text:`I can recognise songs from just a few notes` },
  { id:'M11', scale:'musical',        text:`I often have a song or rhythm in my head while working` },
  { id:'M12', scale:'musical',        text:`I find it easy to keep rhythm and distinguish musical tones` },
  // KINESTHETIC
  { id:'M13', scale:'kinesthetic',    text:`I learn best by doing, not just watching or reading` },
  { id:'M14', scale:'kinesthetic',    text:`I enjoy physical activities, sports, or working with my hands` },
  { id:'M15', scale:'kinesthetic',    text:`I think better when I can move around or fidget` },
  // INTERPERSONAL
  { id:'M16', scale:'interpersonal',  text:`I understand others' moods and feelings easily` },
  { id:'M17', scale:'interpersonal',  text:`People often come to me for advice or support` },
  { id:'M18', scale:'interpersonal',  text:`I enjoy group work and collaborative projects` },
  // INTRAPERSONAL
  { id:'M19', scale:'intrapersonal',  text:`I am very aware of my own strengths and weaknesses` },
  { id:'M20', scale:'intrapersonal',  text:`I prefer working alone and setting my own goals` },
  { id:'M21', scale:'intrapersonal',  text:`I regularly reflect on my thoughts, feelings, and motivations` },
  // NATURALIST
  { id:'M22', scale:'naturalist',     text:`I notice details about plants, animals, and natural phenomena` },
  { id:'M23', scale:'naturalist',     text:`I enjoy spending time in nature and find it calming` },
  { id:'M24', scale:'naturalist',     text:`I am interested in environmental issues and conservation` },
]

// ── DIMENSION 7: WORK VALUES (15 questions) ───────────────────────────────────
// Format: 1=Not Important to 5=Extremely Important
export const VALUES_QUESTIONS = [
  { id:'V1',  scale:'achievement',   text:`Being recognised for high quality work and accomplishments` },
  { id:'V2',  scale:'independence',  text:`Having the freedom to work in my own way without close supervision` },
  { id:'V3',  scale:'recognition',   text:`Being well known and respected in my field or community` },
  { id:'V4',  scale:'relationships', text:`Working closely with people I like and developing meaningful friendships at work` },
  { id:'V5',  scale:'support',       text:`Having a manager and organisation that supports my personal development` },
  { id:'V6',  scale:'conditions',    text:`Having a comfortable, safe, and pleasant work environment` },
  { id:'V7',  scale:'security',      text:`Having stable, secure employment with consistent income` },
  { id:'V8',  scale:'variety',       text:`Having diverse tasks and new challenges every day — never routine` },
  { id:'V9',  scale:'creativity',    text:`Being able to create, innovate, and try completely new approaches` },
  { id:'V10', scale:'lifestyle',     text:`Maintaining a healthy work-life balance and personal time` },
  { id:'V11', scale:'achievement',   text:`Continuously improving and mastering difficult skills` },
  { id:'V12', scale:'independence',  text:`Being able to make my own decisions without needing approval` },
  { id:'V13', scale:'security',      text:`Having a clear career path and predictable future growth` },
  { id:'V14', scale:'creativity',    text:`Being able to build something new from scratch — a product, company, or idea` },
  { id:'V15', scale:'lifestyle',     text:`Having flexibility in working hours and the option to work remotely` },
]

// ── DIMENSION 8: LEARNING STYLE (10 questions) ───────────────────────────────
// Format: 1=Strongly Disagree to 5=Strongly Agree
export const LEARNING_QUESTIONS = [
  { id:'L1',  scale:'visual',        text:`I understand information better when it is presented as charts, diagrams, or videos` },
  { id:'L2',  scale:'auditory',      text:`I find it easier to remember things after hearing them explained aloud` },
  { id:'L3',  scale:'kinesthetic',   text:`I learn best when I can physically practice or experiment myself` },
  { id:'L4',  scale:'visual',        text:`I prefer reading and taking detailed notes over listening to lectures` },
  { id:'L5',  scale:'auditory',      text:`I enjoy group discussions and talking through problems to understand them` },
  { id:'L6',  scale:'converger',     text:`I prefer to apply theoretical ideas to practical problems` },
  { id:'L7',  scale:'diverger',      text:`I enjoy brainstorming and generating many creative ideas` },
  { id:'L8',  scale:'assimilator',   text:`I prefer to analyse and organise information into logical frameworks` },
  { id:'L9',  scale:'accommodator',  text:`I prefer hands-on, trial-and-error learning over theory` },
  { id:'L10', scale:'kinesthetic',   text:`I remember experiences and skills better than facts or lectures` },
]

// ── MODULE CONFIGURATION BY TIER ─────────────────────────────────────────────
export const TIER_CONFIG = {
  stream: {  // Class 8-10 — simplified
    label: 'Stream Explorer',
    modules: ['orientation','personality','interest','mi','learning'],
    totalQuestions: 48+30+25+24+10,  // 137 questions ~60 min
    description: 'Discover your interests and strengths to choose the right stream'
  },
  career: {  // Class 11-12 — full
    label: 'Career Compass',
    modules: ['orientation','personality','interest','aptitude','eq','mi','values'],
    totalQuestions: 48+50+25+50+20+24+15,  // 232 questions ~120 min
    description: 'Comprehensive assessment to identify your ideal career paths'
  },
  graduate: {  // College — full + advanced
    label: 'Professional Profile',
    modules: ['orientation','personality','interest','aptitude','eq','mi','values','learning'],
    totalQuestions: 48+50+25+50+20+24+15+10,  // 242 questions ~130 min
    description: 'Deep profiling for career specialisation and professional development'
  }
}

// ── MODULE METADATA ───────────────────────────────────────────────────────────
export const MODULE_INFO = {
  orientation: { label:`Career Orientation`,  subtitle:`Holland RIASEC Model`,        icon:'🧭', color:'#6366f1', duration:'10 min', type:'likert5',    questions: ORIENTATION_QUESTIONS },
  personality: { label:`Personality Profile`,  subtitle:`Big Five OCEAN Model`,        icon:'🧠', color:'#8b5cf6', duration:'12 min', type:'likert5',    questions: PERSONALITY_QUESTIONS },
  interest:    { label:`Interest Mapping`,      subtitle:`Career Domain Interests`,     icon:'💡', color:'#f59e0b', duration:'8 min',  type:'likert5',    questions: INTEREST_QUESTIONS },
  aptitude:    { label:`Aptitude Battery`,      subtitle:`10 Cognitive Abilities`,      icon:'⚡', color:'#ef4444', duration:'25 min', type:'timed_mcq',  questions: APTITUDE_QUESTIONS },
  eq:          { label:`Emotional Intelligence`, subtitle:`Situational Judgment Test`,  icon:'❤️', color:'#ec4899', duration:'10 min', type:'weighted_mcq', questions: EQ_QUESTIONS },
  mi:          { label:`Multiple Intelligences`, subtitle:`Gardner's 8 Intelligences`, icon:'🌟', color:'#10b981', duration:'8 min',  type:'likert3',    questions: MI_QUESTIONS },
  values:      { label:`Work Values`,           subtitle:`Super's Work Values`,        icon:'🎯', color:'#0ea5e9', duration:'6 min',  type:'likert5',    questions: VALUES_QUESTIONS },
  learning:    { label:`Learning Style`,        subtitle:`VAK + Kolb's Model`,         icon:'📚', color:'#14b8a6', duration:'5 min',  type:'likert5',    questions: LEARNING_QUESTIONS },
}
