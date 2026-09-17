export interface CounselorData {
  id: number;
  name: string;
  crn?: string;
  specialization: string;
  institution: string;
  acronym: string;
  education?: string;
  experience: string;
  contact_phone?: string;
  email?: string;
  avatar_url: string;
  full_photo_url: string;
  summary?: string;
  quote: string;
  motto?: string;
  pillars: string[];
  focus_areas: string[];
  message_to_students: string;
  if_scary: string;
  fun_facts: string;
  languages: string;
  availability: string;
  is_online: boolean;
}

export const VISHNU_WELLNESS_CENTRE = {
  name: "Vishnu Wellness Centre",
  institution: "Sri Vishnu Educational Society",
  established: "2017",
  tagline: "Empowering Minds. Inspiring Lives.",
  vision: "To foster a campus community where every student feels supported, empowered, and equipped to thrive emotionally, personally, and academically.",
  mission: [
    "Provide accessible, ethical, and confidential psychological services.",
    "Promote mental health awareness, resilience, and emotional well-being.",
    "Encourage early intervention and reduce the stigma surrounding mental health.",
    "Create safe spaces that empower students to grow and flourish."
  ],
  pillars: ["Compassion", "Confidentiality", "Empathy", "Integrity", "Well-Being"],
  logo_url: "/vishnu_wellness_logo.png"
};

export const OFFICIAL_COUNSELORS: CounselorData[] = [
  {
    id: 1,
    name: "Ram Prudhvi Teja",
    crn: "CRN5259951",
    specialization: "Senior Wellness Counsellor • Author • Mind-Body Therapist",
    institution: "Vishnu Institute of Technology",
    acronym: "VIT",
    education: "Master’s in Psychology and PGDMH",
    experience: "7+ Years",
    contact_phone: "+91 8985002211",
    email: "prudhvi.v@vishnu.edu.in",
    avatar_url: "/counselors/ram_prudhvi_teja_head.jpg?v=2",
    full_photo_url: "/counselors/ram_prudhvi_teja_full.jpg?v=2",
    summary: "I believe that every person deserves a safe space to be heard, understood, and accepted without judgment. My approach focuses on helping individuals understand their thoughts, emotions, and behavioural patterns, while developing healthier ways to cope with challenges and navigate life's transitions. I aim to create a compassionate, supportive, and non-judgmental space where individuals can slow down, reconnect with themselves, gain clarity, and work towards meaningful emotional wellbeing and personal growth.",
    quote: "The best way to predict your future is to create it—not from the influences of your past experiences, but through the power of your imagination. ♡",
    motto: "SUPPORTING MINDS. ENCOURAGING GROWTH. INSPIRING WELLNESS.",
    pillars: ["Non judgemental", "Evidence based", "Solution based", "Empathetic"],
    focus_areas: [
      "Anxiety",
      "Stress",
      "Relationships",
      "Self-esteem",
      "Emotional Wellbeing",
      "Life Transitions",
      "Self-discovery",
      "Coping & Resilience",
      "Trauma"
    ],
    message_to_students: "Seeking help is not a sign of weakness—it is a sign of courage. You don't have to carry every burden or suffer alone in silence. Asking for support isn't giving up, it's choosing growth over struggle and hope over fear. ♡",
    if_scary: "Counselling is simply a safe conversation. There is no judgment, no pressure, and no expectation to have everything figured out. We will move at your pace, and everything you share will be treated with respect and confidentiality within professional and ethical guidelines. ♡",
    fun_facts: "Outside the counselling room, you'll often find me reading psychology books and novels, travelling, and exploring new places and cultures. I love trying different cuisines and discovering new food experiences. I enjoy playing cricket; it keeps me active and energized. Life is a journey of continuous learning. ♡",
    languages: "Telugu & English",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    is_online: true
  },
  {
    id: 2,
    name: "Devika Babu",
    specialization: "Wellness Counsellor",
    institution: "Vishnu Women's University",
    acronym: "VWU",
    education: "MSc Psychology (clinical specialization), Bsc Psychology, PGDSC",
    experience: "4 Years",
    contact_phone: "9100972237",
    email: "psychologist@svecw.edu.in",
    avatar_url: "/counselors/devika_babu_head.jpg?v=2",
    full_photo_url: "/counselors/devika_babu_full.jpg?v=2",
    summary: "Devika Babu is a counselling psychologist with over 3.5 years of experience working in clinics, rehabilitation and educational settings. She has worked with individuals across age groups—from children to older adults—on concerns related to stress, anxiety, emotional well-being, relationship issues, academic pressure and life changes. Her experience also includes preparing and facilitating sessions on mental health and psychoeducation, administering and interpreting psychometric tests and implementing wellness programs and activities.",
    quote: "Creating a space where you can be yourself and talk about the things that really matter to you ♡",
    motto: "It's okay if your journey looks different from someone else's. Progress is more important than perfection. ♡",
    pillars: ["Ethical", "Compassionate", "Empowering", "Crisis intervention"],
    focus_areas: [
      "Stress management and emotional well-being",
      "Grief, loss and trauma related concerns",
      "Relationship and interpersonal difficulties",
      "Career and life adjustments",
      "Crisis intervention and management"
    ],
    message_to_students: "The world is scary sometimes. You don't have to face it alone. I'm not here to judge you but to support you. Progress is more important than perfection. ♡",
    if_scary: "Creating a space where you can be yourself and talk about the things that really matter to you. I'm not here to judge you but to support you. ♡",
    fun_facts: "My brain is basically a storage unit for random facts. If there's a conspiracy theory, I'm already down that rabbit hole. If I'm quiet, I'm probably into a good book or series. If there's cold coffee involved, I'm in. Rainy days >>> Sunny days. ♡",
    languages: "English, Malayalam, Hindi, Tamil",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    is_online: true
  },
  {
    id: 3,
    name: "Angel Mariam Benny",
    specialization: "Wellness Counsellor",
    institution: "Vishnu Dental College",
    acronym: "VDC",
    education: "Master’s in Clinical Psychology — Specialization in Clinical",
    experience: "4+ Years",
    contact_phone: "7075214208",
    email: "AngelBenny99@gmail.com",
    avatar_url: "/counselors/angel_benny_head.jpg?v=2",
    full_photo_url: "/counselors/angel_benny_full.jpg?v=2",
    summary: "I believe in making space for the things that need to be heard, but often go unheard. My approach focuses on creating a safe, compassionate, and non-judgmental space where individuals can slow down, understand themselves better, and navigate the experiences that shape their emotional wellbeing.",
    quote: "Making space for the overthinking, the chaos and the 'I'm fine' that definitely isn't fine. Making space for all of it and maybe even make sense of it together. ♡",
    motto: "Helping you, one day at a time. ♡",
    pillars: ["Confidential", "Compassionate", "Non judgemental", "Patient"],
    focus_areas: [
      "Anxiety",
      "Stress",
      "Interpersonal issues",
      "Self-esteem",
      "Emotional Wellbeing",
      "Life Transitions",
      "Self-discovery",
      "Coping & Resilience"
    ],
    message_to_students: "I hope that every student knows that no problem is too small to ask for help. There is a place where you can be heard without judgement, seen with compassion and accepted as you are. ♡",
    if_scary: "Remember it isn't just for the hard days. It is also for the little wins, the big feelings, the chaos and everything in between, we've got room for it all. Let's take it one conversation at a time. ♡",
    fun_facts: "Dogs > Cats > Everything else. Always one book away from disappearing into a world of wizards or mysteries. Unpopular opinion: I'd pick water over coffee or tea any day. If sleep were an Olympic sport I'd at least make it to the finals. ♡",
    languages: "English, Hindi, Malayalam",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    is_online: true
  },
  {
    id: 4,
    name: "Akshitha Selvaraj",
    specialization: "Wellness Counsellor",
    institution: "Shri Vishnu College of Pharmacy",
    acronym: "SVCP",
    education: "MSc Psychology (Health and Wellbeing)",
    experience: "1 Year",
    contact_phone: "7842981717",
    email: "akshitha.s@svcp.edu.in",
    avatar_url: "/counselors/akshitha_selvaraj_head.jpg?v=2",
    full_photo_url: "/counselors/akshitha_selvaraj_full.jpg?v=2",
    summary: "I believe in creating a safe, non-judgmental, and confidential space where students feel heard, understood, and supported. My approach is empathetic and collaborative, helping individuals build resilience, develop healthy coping strategies, and improve emotional well-being. I believe every individual is unique, and through open conversations, I encourage students to explore their strengths, build self-awareness, and navigate challenges with confidence. My goal is to support students in coping with difficulties while encouraging personal growth, self-discovery, and a healthier, more balanced life.",
    quote: "Every conversation is a step toward healing, growth, and self-discovery ♡",
    motto: "Empathetic, collaborative, and focused on helping individuals build resilience and achieve emotional well-being. ♡",
    pillars: ["Safe", "Non-judgemental", "Collaborative", "Confidential"],
    focus_areas: [
      "Stress",
      "Interpersonal & Relationship Issues",
      "Anxiety",
      "Negative thinking",
      "Coping & Resilience",
      "Personal Growth",
      "Time Management",
      "Overall Wellbeing"
    ],
    message_to_students: "It's ok to ask for support, even when you simply need someone to listen. Seeking help is a sign of strength. It's okay to make mistakes, ask for help, take breaks, and grow at your own pace—every step forward matters. ♡",
    if_scary: "It's completely normal to feel nervous before your first session. Counseling is simply a conversation where you can be yourself without fear of judgment. You don't have to have the 'right words'. We'll figure things out together, one step at a time. ♡",
    fun_facts: "I enjoy creating interactive mental health awareness programs and wellness initiatives for students. I believe that small, consistent changes make a big difference in mental well-being. I love coffee, good music, and getting to know people's stories. ♡",
    languages: "Telugu, English, Tamil & Hindi",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    is_online: true
  },
  {
    id: 5,
    name: "Gadi Navya Sri",
    specialization: "Wellness Counsellor",
    institution: "B.V. Raju College",
    acronym: "BVRC",
    education: "M.A Psychology",
    experience: "3 Years",
    contact_phone: "+91 8500567859",
    email: "navyasri.psy@gmail.com",
    avatar_url: "/counselors/navya_sri_head.jpg?v=2",
    full_photo_url: "/counselors/navya_sri_full.jpg?v=2",
    summary: "I see counseling as a way to better understand ourselves, our emotions, and the challenges we face. My work focuses on helping individuals navigate academic and personal pressures, understand their emotional patterns, build confidence, and develop practical ways to cope with everyday challenges. I aim to support individuals in gaining greater self-awareness and finding clarity and confidence as they move forward.",
    quote: "Try, even if you fail, atleast you'll know what you can do differently next time ♡",
    motto: "I believe in slow and gradual change rather than quick fixes. Working at your pace, finding small, practical ways to move forward. ♡",
    pillars: ["Empathetic", "Non-Judgemental", "Supportive", "Solution-Focused"],
    focus_areas: [
      "Relationship & Family Concerns",
      "Academic Stress & Pressure",
      "Time Management & Procrastination",
      "Emotional Struggles & Self-Doubt",
      "Adjustment & Life Transitions",
      "Crisis Situations & Emotional Support",
      "Self-Awareness & Confidence Building"
    ],
    message_to_students: "It's okay to be different. You don't have to think, feel or choose the same as everyone else. Respect others' choices, express your own thoughts, and stay open to new perspectives. Seeing things differently helps us understand ourselves better. ♡",
    if_scary: "You don't need to know what to say. Just take that first step and come for a conversation with someone who is genuinely interested in listening without any judgement. There's no need to have the 'right' words or a 'big enough' problem. Come as you are. ♡",
    fun_facts: "I genuinely enjoy a good conversation. I can easily get lost in nature's beauty and calm. Pets & little humans are my instant mood-lifters. I believe in the little things - a meaningful conversation, a small step, a good laugh or simply being heard. ♡",
    languages: "Telugu & English",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    is_online: true
  },
  {
    id: 6,
    name: "Sahithi Challa",
    specialization: "Wellness Counsellor • Forensic Psychologist",
    institution: "Vishnu School",
    acronym: "VISHNU",
    education: "Master’s in Forensic Psychology and Trained Body Language Analyst",
    experience: "1+ Years",
    contact_phone: "6301187622",
    email: "sahithichalla.2001@gmail.com",
    avatar_url: "/counselors/sahithi_challa_head.jpg?v=2",
    full_photo_url: "/counselors/sahithi_challa_full.jpg?v=2",
    summary: "I believe in creating a safe, empathetic, and non-judgmental space where individuals feel heard, understood, and supported. My approach focuses on helping individuals develop greater self-awareness, understand their thoughts and emotions, build healthy coping strategies, and navigate personal, academic, and interpersonal challenges. I aim to support individuals in recognising their strengths, building resilience, and developing practical strategies for emotional wellbeing and personal growth. I value a compassionate and collaborative approach that allows individuals to explore their experiences at their own pace and work towards greater clarity and confidence.",
    quote: "A decision doesn't define you. Your commitment to it does. ♡",
    motto: "Helping you untangle your thoughts with empathy, curiosity, and practical tools that actually work. ♡",
    pillars: ["Empathetic", "Curious", "Practical tools", "Non-judgmental"],
    focus_areas: [
      "Emotional Wellbeing",
      "Anxiety",
      "Stress Management",
      "Academic Stress",
      "Self-esteem & Confidence",
      "Interpersonal & Relationship Concerns",
      "Coping & Resilience",
      "Self-awareness",
      "Life Transitions",
      "Crisis Support"
    ],
    message_to_students: "You don't have to carry every burden alone. Speaking up isn't a sign of weakness; it's the first step toward healing. Small conversations today can prevent bigger struggles tomorrow. ♡",
    if_scary: "Your feelings are valid. Your story matters. And you deserve a space where both are welcomed with care. My counselling space is a judgment-free zone; you don't have to have the 'right words' to talk to me. ♡",
    fun_facts: "I'm a Counselling Psychologist with a background in Forensic Psychology (yes, crime documentaries are basically homework 🕵️). My comfort combo? Books and biryani. Always. I can probably recommend you a psychology book, a comfort movie, or a biryani place depending on what kind of day you're having. ♡",
    languages: "Telugu, English, Hindi, Kannada",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    is_online: true
  },
  {
    id: 7,
    name: "Bantu Anumitha",
    specialization: "Wellness Counsellor",
    institution: "Smt. B. Seetha Polytechnic College",
    acronym: "SBSP",
    education: "MSc. Clinical Psychology",
    experience: "1 Year",
    contact_phone: "9390268994",
    email: "anumitab2019@gmail.com",
    avatar_url: "/counselors/bantu_anumitha_head.jpg?v=2",
    full_photo_url: "/counselors/bantu_anumitha_full.jpg?v=2",
    summary: "I Believe every individual deserves to be heard without judgement. My role is not to tell you who to become, but to help you discover your strengths, build healthier coping skills through empathy, confidentiality and building resilience.",
    quote: "Healing isn't changing who you are; it's uncovering who you've always been ♡",
    motto: "My role is to help you discover your strengths and build healthier coping skills through empathy, confidentiality and building resilience. ♡",
    pillars: ["Empathetic", "Non-Judgemental", "Strength-Based", "Confidential"],
    focus_areas: [
      "Stress",
      "Anxiety",
      "Relationships",
      "Emotional wellbeing",
      "Anger Management"
    ],
    message_to_students: "You don't have to be perfect to be worthy, you are enough, even while you're growing. Asking for help doesn't mean you are weak, it means you are choosing to heal in a healthier way and you don't have to do it all alone. ♡",
    if_scary: "Taking the first step is often the hardest but it will be the most meaningful. There is no pressure to share everything in the first session, we will go forward at your pace. Silence is welcomed and tears are okay. ♡",
    fun_facts: "I believe empathy is the foundation of healing. I enjoy reading about psychology, dreams and human behavior. I believe progress should be celebrated, no matter how small. No, I can't read minds - but I do love understanding people. ♡",
    languages: "English, Hindi, Telugu",
    availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    is_online: true
  }
];

export function findCounselorById(id: number | string): CounselorData | undefined {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return OFFICIAL_COUNSELORS.find((c) => c.id === numId);
}

export function findCounselorByName(name: string): CounselorData | undefined {
  if (!name) return undefined;
  const target = name.toLowerCase().trim();
  return OFFICIAL_COUNSELORS.find(
    (c) => c.name.toLowerCase().trim() === target || target.includes(c.name.toLowerCase().trim())
  );
}
