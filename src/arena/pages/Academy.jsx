import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Check, Lock, Clock, Zap, ChevronRight, ChevronLeft, ArrowLeft, GraduationCap } from 'lucide-react';
import { LESSONS, CATEGORIES } from '../data/lessons';
import { MOCK_USER } from '../data/mockUser';
import Tabs from '../components/ui/Tabs';

export default function Academy() {
  const [activeCategory, setActiveCategory] = useState('all');
  const user = MOCK_USER;

  const filtered = activeCategory === 'all' ? LESSONS : LESSONS.filter(l => l.category === activeCategory);
  const totalCompleted = Object.values(user.lessonProgress).filter(l => l.completed).length;
  const totalXp = Object.values(user.lessonProgress).reduce((sum, l) => sum + (l.completed ? (LESSONS.find(ll => ll.id === l.id)?.xp || 0) : 0), 0);

  const tabs = CATEGORIES.map(c => ({ id: c.id, label: c.label }));

  return (
    <div className="max-w-6xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
            <BookOpen size={20} className="text-violet-400" />
          </div>
          AI Academy
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Bite-sized lessons that fit between classes. 5 minutes, real skills.</p>
      </div>

      {/* Stats */}
      <div className="glass-panel border border-white/5 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm text-zinc-400">
          <span className="font-semibold text-zinc-200">{totalCompleted}</span> / {LESSONS.length} lessons completed
        </span>
        <span className="flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-full px-2.5 py-1">
          <Zap size={12} /> {totalXp} XP earned
        </span>
      </div>

      <Tabs tabs={tabs} active={activeCategory} onChange={setActiveCategory} />

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(lesson => {
          const progress = user.lessonProgress[lesson.id];
          const completed = progress?.completed;
          const inProgress = progress && !completed && progress.timeSpent > 0;

          return (
            <Link
              key={lesson.id}
              to={`/academy/${lesson.id}`}
              className="glass-panel border border-white/5 rounded-2xl p-4 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-2xs font-mono font-medium px-2 py-0.5 rounded-full border
                  ${completed ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' :
                    inProgress ? 'bg-amber-500/10 border-amber-400/30 text-amber-300' :
                    'bg-white/5 border-white/10 text-zinc-500'}
                `}>
                  {lesson.difficulty}
                </span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                  ${completed ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-white/5 border border-white/10'}
                `}>
                  {completed ? <Check size={13} className="text-emerald-400" /> :
                   inProgress ? <Clock size={12} className="text-amber-400" /> :
                   <Lock size={12} className="text-zinc-600" />}
                </div>
              </div>
              <h3 className="font-display font-semibold text-sm text-zinc-200 group-hover:text-white mb-1 leading-snug">
                {lesson.title}
              </h3>
              <p className="text-2xs text-zinc-600 mb-3 line-clamp-2">{lesson.summary}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xs text-zinc-600 font-mono flex items-center gap-1">
                  <Clock size={10} /> {lesson.duration}
                </span>
                <span className="text-2xs font-mono text-violet-300 bg-violet-500/10 border border-violet-400/20 rounded-full px-2 py-0.5">
                  +{lesson.xp} XP
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function LessonDetail() {
  const { lessonId } = useParams();
  const lesson = LESSONS.find(l => l.id === lessonId);
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState({});
  const [completed, setCompleted] = useState(false);

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-zinc-500">Lesson not found.</p>
        <Link to="/academy" className="text-cyan-400 text-sm mt-2 inline-block hover:underline">Back to Academy</Link>
      </div>
    );
  }

  const allAnswered = lesson.quiz.every((_, i) => answers[i] !== undefined);
  const allCorrect = lesson.quiz.every((q, i) => answers[i] === q.correct);

  function handleAnswer(qIdx, optIdx) {
    if (showFeedback[qIdx]) return;
    setAnswers(a => ({ ...a, [qIdx]: optIdx }));
    setShowFeedback(f => ({ ...f, [qIdx]: true }));
  }

  function markComplete() {
    setCompleted(true);
  }

  const quizScore = lesson.quiz.filter((q, i) => answers[i] === q.correct).length;

  return (
    <div className="max-w-3xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <Link to="/academy" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} /> Back to Academy
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xs font-mono text-zinc-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{lesson.category}</span>
          <span className="text-2xs font-mono text-zinc-500">{lesson.duration}</span>
          <span className="text-2xs font-mono text-violet-300 bg-violet-500/10 border border-violet-400/20 rounded-full px-2 py-0.5">+{lesson.xp} XP</span>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">{lesson.title}</h1>
        <p className="text-sm text-zinc-500 mt-1">{lesson.summary}</p>
      </div>

      {/* Content */}
      <div className="glass-panel border border-white/5 rounded-2xl p-6 lg:p-8 prose-invert prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>').replace(/#{1,4}\s(.+)/g, '<h2 class="font-display font-bold text-lg text-zinc-100 mt-6 mb-3">$1</h2>').replace(/`([^`]+)`/g, '<code class="bg-white/5 px-1.5 py-0.5 rounded text-cyan-300 text-xs font-mono">$1</code>').replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>') }} />
      </div>

      {/* Quiz */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <GraduationCap size={18} className="text-violet-400" /> Knowledge Check
        </h2>
        <div className="space-y-4">
          {lesson.quiz.map((q, qi) => (
            <div key={qi} className="glass-panel border border-white/5 rounded-xl p-5">
              <p className="text-sm font-medium text-zinc-200 mb-3">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect = q.correct === oi;
                  const show = showFeedback[qi];

                  return (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(qi, oi)}
                      disabled={show}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all
                        ${show && isCorrect ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200' :
                          show && isSelected && !isCorrect ? 'bg-red-500/10 border-red-400/30 text-red-200' :
                          'border-white/5 text-zinc-300 hover:bg-white/5'}
                        ${!show ? 'cursor-pointer' : 'cursor-default'}
                      `}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold
                        ${show && isCorrect ? 'bg-emerald-500/20 text-emerald-300' :
                          show && isSelected ? 'bg-red-500/20 text-red-300' :
                          'bg-white/5 text-zinc-500'}
                      `}>
                        {show && isCorrect ? <Check size={12} /> : String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showFeedback[qi] && (
                <p className="text-xs text-zinc-400 mt-3 pl-9">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Complete */}
      {allAnswered && !completed && (
        <button
          onClick={markComplete}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 font-semibold text-sm hover:opacity-90"
        >
          <Check size={16} /> Mark as Complete · +{lesson.xp} XP
        </button>
      )}

      {completed && (
        <div className="text-center glass-panel border border-emerald-400/20 rounded-2xl p-6">
          <p className="font-display text-lg font-bold text-emerald-300 mb-1">Lesson Complete! 🎉</p>
          <p className="text-sm text-zinc-500">You earned {lesson.xp} XP. Quiz score: {quizScore}/{lesson.quiz.length}</p>
        </div>
      )}
    </div>
  );
}
