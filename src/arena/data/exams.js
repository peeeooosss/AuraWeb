import { Landmark, Building2, ClipboardCheck, Atom, Stethoscope } from 'lucide-react';

export const EXAMS = [
  {
    id: 'upsc',
    name: 'UPSC',
    full: 'Union Public Service Commission',
    icon: Landmark,
    aspirants: '11.5L aspirants',
    color: 'violet',
    description: 'Civil Services Examination for IAS, IPS, IFS and other Group A & B services.',
  },
  {
    id: 'apsc',
    name: 'APSC',
    full: 'Assam Public Service Commission',
    icon: Building2,
    aspirants: '2.1L aspirants',
    color: 'cyan',
    description: 'State-level competitive exam for Grade A & B posts in Assam.',
  },
  {
    id: 'adre',
    name: 'ADRE',
    full: 'Assam Direct Recruitment Exam',
    icon: ClipboardCheck,
    aspirants: '8.4L applicants',
    color: 'amber',
    description: 'Direct recruitment for Grade III & IV posts in Assam government departments.',
  },
  {
    id: 'jee',
    name: 'JEE',
    full: 'Joint Entrance Examination',
    icon: Atom,
    aspirants: '12L+ candidates',
    color: 'green',
    description: 'Gateway to NITs, IIITs, and other CFTIs for engineering aspirants.',
  },
  {
    id: 'neet',
    name: 'NEET',
    full: 'National Eligibility cum Entrance Test',
    icon: Stethoscope,
    aspirants: '23L+ candidates',
    color: 'rose',
    description: 'Single national-level exam for MBBS, BDS, and AYUSH admissions.',
  },
];

export const EXAM_DETAILS = {
  upsc: {
    timeline: [
      ['Notification Released', 'Feb 2025'],
      ['Prelims Exam', 'May 2025'],
      ['Mains Exam', 'Sep 2025'],
      ['Interview/Personality Test', 'Feb 2026'],
      ['Final Result', 'Apr 2026'],
    ],
    cutoff: {
      label: 'General Category Cutoff (Prelims)',
      value: '92.5 %ile',
      trend: '+1.8%',
      up: true,
    },
    books: [
      { title: 'Indian Polity', author: 'M. Laxmikanth', price: '₹499', rating: 4.7, img: '📕' },
      { title: 'Certificate Physical & Human Geography', author: 'G.C. Leong', price: '₹380', rating: 4.6, img: '📗' },
      { title: 'Indian Economy', author: 'Ramesh Singh', price: '₹425', rating: 4.5, img: '📘' },
      { title: 'A Brief History of Modern India', author: 'Spectrum', price: '₹290', rating: 4.8, img: '📙' },
    ],
    strategy: [
      'Start with NCERTs (Class 6-12) for foundational knowledge',
      'Read The Hindu daily for current affairs',
      'Practice previous year papers (last 10 years)',
      'Take monthly mock tests to track progress',
      'Focus on answer writing for Mains from Day 1',
    ],
  },
  apsc: {
    timeline: [
      ['Notification Released', 'Mar 2025'],
      ['Prelims Exam', 'Jun 2025'],
      ['Mains Exam', 'Oct 2025'],
      ['Interview', 'Jan 2026'],
      ['Final Result', 'Mar 2026'],
    ],
    cutoff: {
      label: 'Grade-A Cutoff (General)',
      value: '58.2%',
      trend: '+2.1%',
      up: true,
    },
    books: [
      { title: 'Assam: A Concise History', author: 'D. Nath', price: '₹340', rating: 4.5, img: '📕' },
      { title: 'APSC CCE Prelims Guide', author: 'Lucent Assam', price: '₹425', rating: 4.4, img: '📗' },
      { title: 'Assam Geography & Culture', author: 'B.K. Baruah', price: '₹280', rating: 4.3, img: '📘' },
      { title: 'General Studies Paper I', author: 'McGraw Hill', price: '₹520', rating: 4.6, img: '📙' },
    ],
    strategy: [
      'Focus heavily on Assam-specific topics (history, geography, culture)',
      'Read Assam Tribune daily for state current affairs',
      'Solve previous year APSC papers (last 5 years)',
      'Join a test series for Prelims practice',
      'Study Assam Accord and its provisions thoroughly',
    ],
  },
  adre: {
    timeline: [
      ['Notification Released', 'Aug 2025'],
      ['Application Deadline', 'Sep 2025'],
      ['Written Exam', 'Nov 2025'],
      ['Answer Key Release', 'Dec 2025'],
      ['Merit List', 'Apr 2026'],
    ],
    cutoff: {
      label: 'Grade III Cutoff (General)',
      value: '62.5%',
      trend: '+3.2%',
      up: true,
    },
    books: [
      { title: 'Assam Samayik Prasanga', author: 'Bikash Ch. Nath', price: '₹220', rating: 4.6, img: '📕' },
      { title: "Lucent's General Knowledge", author: 'Lucent Publications', price: '₹195', rating: 4.8, img: '📗' },
      { title: 'Computer Awareness', author: 'Arihant', price: '₹175', rating: 4.4, img: '📘' },
      { title: 'General Science', author: 'Lucent', price: '₹210', rating: 4.5, img: '📙' },
    ],
    strategy: [
      'Focus on General Knowledge and Current Affairs',
      'Practice Computer Awareness (mandatory for Grade III)',
      'Solve previous year ADRE papers',
      'Study Assam history, geography, and culture',
      'Time management is key — practice with a timer',
    ],
  },
  jee: {
    timeline: [
      ['Registration Opens', 'Nov 2025'],
      ['Session 1 Exam', 'Jan 2026'],
      ['Session 2 Exam', 'Apr 2026'],
      ['Result Declaration', 'May 2026'],
      ['Counselling (JoSAA)', 'Jun 2026'],
    ],
    cutoff: {
      label: 'JEE Main 75%ile Cutoff',
      value: '93.2 %ile',
      trend: '-0.6%',
      up: false,
    },
    books: [
      { title: 'Problems in Physics', author: 'D.C. Pandey', price: '₹410', rating: 4.5, img: '📕' },
      { title: 'Objective Mathematics', author: 'R.D. Sharma', price: '₹560', rating: 4.6, img: '📗' },
      { title: 'Organic Chemistry', author: 'Morrison & Boyd', price: '₹680', rating: 4.4, img: '📘' },
      { title: 'Cengage Mathematics', author: 'G. Tewani', price: '₹450', rating: 4.7, img: '📙' },
    ],
    strategy: [
      'Master NCERT first — 60% questions are NCERT-based',
      'Practice 30 problems daily across PCM',
      'Take weekly full-length mock tests',
      'Analyze mistakes and maintain an error log',
      'Focus on high-weightage topics: Mechanics, Algebra, Organic Chemistry',
    ],
  },
  neet: {
    timeline: [
      ['Registration Opens', 'Dec 2025'],
      ['Admit Card Release', 'Apr 2026'],
      ['Exam Day', 'May 2026'],
      ['Answer Key', 'May 2026'],
      ['Result Declaration', 'Jun 2026'],
    ],
    cutoff: {
      label: 'NEET General Category Cutoff',
      value: '137/720',
      trend: '+5 marks',
      up: true,
    },
    books: [
      { title: 'NCERT Biology (Class 11-12)', author: 'NCERT', price: '₹210', rating: 4.9, img: '📕' },
      { title: 'Objective Biology', author: 'Dinesh', price: '₹495', rating: 4.4, img: '📗' },
      { title: 'Physics for NEET', author: 'C.P. Singh', price: '₹520', rating: 4.5, img: '📘' },
      { title: 'Objective Chemistry', author: 'R.K. Gupta', price: '₹440', rating: 4.3, img: '📙' },
    ],
    strategy: [
      'NCERT is your Bible — read Biology line by line',
      'Focus on high-weightage chapters: Genetics, Ecology, Human Physiology',
      'Practice diagrams — they carry bonus marks',
      'Take weekly NEET-pattern mock tests',
      'Revision is key — revise every topic within 7 days',
    ],
  },
};

export const EXAM_COLORS = {
  upsc: { bg: 'bg-violet-500/10', border: 'border-violet-400/30', text: 'text-violet-300', glow: 'glow-violet-sm' },
  apsc: { bg: 'bg-cyan-500/10', border: 'border-cyan-400/30', text: 'text-cyan-300', glow: 'glow-cyan-sm' },
  adre: { bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-300', glow: 'glow-amber-sm' },
  jee: { bg: 'bg-green-500/10', border: 'border-green-400/30', text: 'text-green-300', glow: 'glow-green-sm' },
  neet: { bg: 'bg-rose-500/10', border: 'border-rose-400/30', text: 'text-rose-300', glow: 'glow-rose-sm' },
};
