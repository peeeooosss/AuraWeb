import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Swords, Clock, Zap, Check, X, ChevronRight, RotateCcw, Share2, Trophy, Users, AlertCircle } from 'lucide-react';
import { CircularProgress } from '../components/ui/ProgressBar';
import { MOCK_USER, LEADERBOARD_DATA } from '../data/mockUser';

const SUBJECTS = [
  { id: 'adre', label: 'ADRE', color: 'amber' },
  { id: 'apsc', label: 'APSC', color: 'cyan' },
  { id: 'jee', label: 'JEE', color: 'green' },
  { id: 'neet', label: 'NEET', color: 'rose' },
  { id: 'ai-basics', label: 'AI Basics', color: 'violet' },
  { id: 'general', label: 'General', color: 'zinc' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30' },
  { id: 'medium', label: 'Medium', color: 'text-amber-300 bg-amber-500/10 border-amber-400/30' },
  { id: 'hard', label: 'Hard', color: 'text-red-300 bg-red-500/10 border-red-400/30' },
];

const COUNTS = [10, 20, 50];

const SAMPLE_QUESTIONS = {
  adre: [
    { q: 'Which Article of the Indian Constitution guarantees the Right to Equality?', options: ['Article 12', 'Article 14', 'Article 19', 'Article 21'], correct: 1, explanation: 'Article 14 guarantees the Right to Equality before law and equal protection of laws.' },
    { q: 'What does ROM stand for in computer terminology?', options: ['Read Only Memory', 'Random Order Memory', 'Run Order Machine', 'Read Open Memory'], correct: 0, explanation: 'ROM = Read Only Memory. It stores data permanently and cannot be modified.' },
    { q: 'Which Mughal emperor built the Taj Mahal?', options: ['Akbar', 'Aurangzeb', 'Shah Jahan', 'Humayun'], correct: 2, explanation: 'Shah Jahan built the Taj Mahal in memory of his wife Mumtaz Mahal.' },
    { q: 'What is the shortcut to undo the last action in MS Word?', options: ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + U', 'Ctrl + X'], correct: 0, explanation: 'Ctrl + Z is the universal undo shortcut in most applications.' },
    { q: 'Which river is known as the lifeline of Assam?', options: ['Brahmaputra', 'Ganges', 'Yamuna', 'Godavari'], correct: 0, explanation: 'The Brahmaputra River is the lifeline of Assam, flowing through the entire state.' },
    { q: 'What is the full form of CPU?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Unit'], correct: 0, explanation: 'CPU = Central Processing Unit, the brain of a computer.' },
    { q: 'Who was the first President of India?', options: ['Jawaharlal Nehru', 'Dr. Rajendra Prasad', 'Sardar Vallabhbhai Patel', 'Dr. B.R. Ambedkar'], correct: 1, explanation: 'Dr. Rajendra Prasad was the first President of India (1950-1962).' },
    { q: 'Which of the following is NOT an input device?', options: ['Keyboard', 'Mouse', 'Monitor', 'Scanner'], correct: 2, explanation: 'Monitor is an output device. The rest are input devices.' },
    { q: 'Assam was formed as a province in which year?', options: ['1912', '1921', '1947', '1950'], correct: 0, explanation: 'Assam was separated from Bengal and made a separate province in 1912.' },
    { q: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correct: 1, explanation: '15% of 200 = (15/100) × 200 = 30.' },
  ],
};

export default function QuizArena() {
  const [phase, setPhase] = useState('setup'); // setup | playing | results
  const [subject, setSubject] = useState('adre');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState(null);
  const timerRef = useRef(null);

  function generateQuiz() {
    const qs = (SAMPLE_QUESTIONS[subject] || SAMPLE_QUESTIONS.adre).slice(0, count);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft(count * 60);
    setSelectedOption(null);
    setShowFeedback(false);
    setPhase('playing');
  }

  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); submitQuiz(); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [phase]);

  function selectOption(idx) {
    if (showFeedback) return;
    setSelectedOption(idx);
    setShowFeedback(true);
    setAnswers(a => ({ ...a, [currentIdx]: idx }));
  }

  function nextQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      submitQuiz();
    }
  }

  function submitQuiz() {
    clearInterval(timerRef.current);
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    questions.forEach((q, i) => {
      const ans = answers[i];
      if (ans === undefined) skipped++;
      else if (ans === q.correct) correct++;
      else wrong++;
    });
    const score = Math.round((correct / questions.length) * 100);
    const xpEarned = correct * 10;
    const timeTaken = (count * 60) - timeLeft;

    setResults({ score, correct, wrong, skipped, xpEarned, timeTaken, total: questions.length });
    setPhase('results');
  }

  function resetQuiz() {
    setPhase('setup');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setSelectedOption(null);
    setShowFeedback(false);
    setResults(null);
    setTimeLeft(0);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerPct = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;
  const timerColor = timeLeft <= 10 ? '#FF3D68' : timeLeft <= 30 ? '#FFB020' : '#2FF3E0';

  if (phase === 'setup') return <QuizSetup subject={subject} setSubject={setSubject} difficulty={difficulty} setDifficulty={setDifficulty} count={count} setCount={setCount} onGenerate={generateQuiz} />;
  if (phase === 'results') return <QuizResults results={results} onRetry={resetQuiz} />;

  const q = questions[currentIdx];
  const isCorrect = answers[currentIdx] === q.correct;

  return (
    <div className="max-w-3xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xs font-mono text-zinc-500">QUESTION {currentIdx + 1} OF {questions.length}</p>
          <div className="h-1.5 w-48 rounded-full bg-white/5 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${timerPct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-sm font-semibold
            ${timeLeft <= 10 ? 'bg-red-500/10 border-red-400/30 text-red-300' : 'bg-white/5 border-white/10 text-zinc-300'}
          `}>
            <Clock size={14} className={timeLeft <= 10 ? 'text-red-400' : 'text-zinc-400'} />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="glass-panel border border-white/5 rounded-2xl p-6 lg:p-8">
        <h2 className="font-display text-lg lg:text-xl font-semibold text-zinc-100 leading-relaxed">
          {q.q}
        </h2>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isAnswer = q.correct === i;
          const showCorrect = showFeedback && isAnswer;
          const showWrong = showFeedback && isSelected && !isAnswer;

          return (
            <button
              key={i}
              onClick={() => selectOption(i)}
              disabled={showFeedback}
              className={`
                flex items-center gap-4 p-4 rounded-xl border text-left transition-all
                ${showCorrect ? 'bg-emerald-500/10 border-emerald-400/40' :
                  showWrong ? 'bg-red-500/10 border-red-400/40 animate-shake' :
                  isSelected ? 'bg-cyan-500/10 border-cyan-400/40' :
                  'glass-panel border-white/5 hover:border-white/15 hover:bg-white/5'}
                ${!showFeedback ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-sm font-bold
                ${showCorrect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' :
                  showWrong ? 'bg-red-500/20 text-red-300 border border-red-400/40' :
                  'bg-white/5 text-zinc-500 border border-white/10'}
              `}>
                {showCorrect ? <Check size={14} /> : showWrong ? <X size={14} /> : String.fromCharCode(65 + i)}
              </span>
              <span className={`text-sm font-medium flex-1 ${showCorrect ? 'text-emerald-200' : showWrong ? 'text-red-200' : 'text-zinc-200'}`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`rounded-xl p-4 border text-sm ${isCorrect ? 'bg-emerald-500/5 border-emerald-400/20' : 'bg-red-500/5 border-red-400/20'}`}>
          <p className={`font-semibold mb-1 ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
            {isCorrect ? 'Correct! 🎯' : 'Incorrect ❌'}
          </p>
          <p className="text-zinc-400 text-xs leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {/* Next */}
      {showFeedback && (
        <button
          onClick={nextQuestion}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {currentIdx < questions.length - 1 ? (
            <>Next Question <ChevronRight size={16} /></>
          ) : (
            <>See Results <Trophy size={16} /></>
          )}
        </button>
      )}

      {/* Navigator */}
      <div className="glass-panel border border-white/5 rounded-xl p-4">
        <p className="text-2xs font-mono text-zinc-500 mb-2">Question Navigator</p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIdx(i); setSelectedOption(answers[i] ?? null); setShowFeedback(answers[i] !== undefined); }}
              className={`
                w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-all
                ${i === currentIdx ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300' :
                  answers[i] !== undefined ? (answers[i] === questions[i].correct ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300') :
                  'bg-white/5 text-zinc-500 hover:bg-white/10'}
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizSetup({ subject, setSubject, difficulty, setDifficulty, count, setCount, onGenerate }) {
  return (
    <div className="max-w-3xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div className="relative rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-zinc-900/60 to-violet-500/5 p-6 lg:p-8 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-2xs font-mono font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-full mb-3">
            <Swords size={12} /> QUIZ ARENA
          </span>
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-2">Start a New Quiz</h2>
          <p className="text-sm text-zinc-400">Choose your subject, difficulty, and number of questions.</p>
        </div>
      </div>

      {/* Subject */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 mb-3 font-mono uppercase tracking-wider">Subject</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUBJECTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all
                ${subject === s.id ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300 glow-cyan-sm' : 'glass-panel border-white/5 text-zinc-400 hover:border-white/15'}
              `}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 mb-3 font-mono uppercase tracking-wider">Difficulty</h3>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-all
                ${difficulty === d.id ? d.color + ' border' : 'glass-panel border-white/5 text-zinc-400 hover:border-white/15'}
              `}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 mb-3 font-mono uppercase tracking-wider">Questions</h3>
        <div className="flex gap-2">
          {COUNTS.map(c => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-all
                ${count === c ? 'bg-violet-500/10 border-violet-400/40 text-violet-300' : 'glass-panel border-white/5 text-zinc-400 hover:border-white/15'}
              `}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={onGenerate}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        <Zap size={16} /> Generate Quiz
      </button>

      {/* Live Feed */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
          <Users size={14} className="text-violet-400" /> Live from the Arena
        </h3>
        <div className="space-y-2">
          {LIVE_FEED.map((a, i) => (
            <div key={i} className="flex items-center gap-3 glass-panel border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-2xs font-bold text-zinc-950 shrink-0">{a.avatar}</div>
              <p className="text-xs text-zinc-300 flex-1 min-w-0">
                <span className="font-semibold text-white">{a.name}</span> {a.text}
              </p>
              <span className="text-2xs text-zinc-600 hidden sm:inline">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizResults({ results, onRetry }) {
  const { score, correct, wrong, skipped, xpEarned, timeTaken, total } = results;
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;

  return (
    <div className="max-w-lg mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CircularProgress value={score} max={100} size={140} strokeWidth={8} label={`${score}%`} sublabel="Score" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-1">
          {score >= 90 ? 'Outstanding! 🏆' : score >= 70 ? 'Great Job! 🎯' : score >= 50 ? 'Good Effort! 💪' : 'Keep Practicing! 📚'}
        </h2>
        <p className="text-sm text-zinc-500">You answered {correct} out of {total} questions correctly</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel border border-emerald-400/20 rounded-xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-emerald-300">{correct}</p>
          <p className="text-2xs text-zinc-500 mt-1">Correct</p>
        </div>
        <div className="glass-panel border border-red-400/20 rounded-xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-red-300">{wrong}</p>
          <p className="text-2xs text-zinc-500 mt-1">Wrong</p>
        </div>
        <div className="glass-panel border border-zinc-400/20 rounded-xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-zinc-400">{skipped}</p>
          <p className="text-2xs text-zinc-500 mt-1">Skipped</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-full px-3 py-1.5">
          <Zap size={14} /> +{xpEarned} XP
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <Clock size={14} /> {mins}m {secs}s
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 font-semibold text-sm hover:opacity-90">
          <RotateCcw size={15} /> Try Again
        </button>
        <button className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl glass-panel border border-white/10 text-zinc-300 text-sm hover:bg-white/5">
          <Share2 size={15} /> Share
        </button>
      </div>
    </div>
  );
}

const LIVE_FEED = [
  { name: 'Priya S.', avatar: 'PS', text: 'scored 9/10 on ADRE Computer Basics!', time: '2m ago' },
  { name: 'Karan S.', avatar: 'KS', text: 'beat their streak with 8/10 on JEE Physics', time: '5m ago' },
  { name: 'Momi D.', avatar: 'MD', text: 'climbed to Rank #4 on the leaderboard', time: '12m ago' },
  { name: 'Neha B.', avatar: 'NB', text: 'completed AI Basics Blitz — 10/10! 🔥', time: '18m ago' },
];
