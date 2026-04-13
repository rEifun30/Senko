import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { Deck } from '../types';
import { applyPass, applyFail } from '../utils/fsrs';

interface ChallengeModeProps {
  deck: Deck;
  onExit: () => void;
  onUpdateCard?: (cardId: string, updates: Partial<Deck['cards'][0]>) => void;
  onUpdateDeckLastStudied?: (deckId: string) => void;
  onRecordStudy?: (cardsCount: number) => void;
}

const TIMER_DURATION = 60;

export default function ChallengeMode({ deck, onExit, onUpdateCard, onUpdateDeckLastStudied, onRecordStudy }: ChallengeModeProps) {
  const [cards] = useState(() => {
    const arr = [...deck.cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState({ pass: 0, fail: 0 });

  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        if (prev + 0.1 >= TIMER_DURATION) {
          setIsFinished(true);
          return TIMER_DURATION;
        }
        return prev + 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Record study activity when session ends
  useEffect(() => {
    if (!isFinished) return;
    const totalAnswered = results.pass + results.fail;
    try {
      onRecordStudy?.(totalAnswered);
    } catch { /* ignore */ }
    try {
      onUpdateDeckLastStudied?.(deck.id);
    } catch { /* ignore */ }
  }, [isFinished]);

  const handleAction = useCallback((action: 'pass' | 'fail') => {
    const currentCard = cards[currentIndex];
    const updatedCard = action === 'pass' ? applyPass(currentCard) : applyFail(currentCard);

    if (onUpdateCard) {
      onUpdateCard(currentCard.id, {
        status: updatedCard.status,
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        lastReviewed: updatedCard.lastReviewed,
      });
    }

    setResults(prev => ({ ...prev, [action]: prev[action] + 1 }));

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeElapsed(0);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setIsFinished(true);
    }
  }, [cards, currentIndex, onUpdateCard]);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 text-lg mb-4">No cards in this deck</p>
        <button
          type="button"
          onClick={onExit}
          className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-2xl max-w-sm w-full text-center space-y-6"
        >
          <h2 className="font-display text-2xl font-bold text-white">Challenge Complete</h2>
          <div className="flex justify-center gap-8">
            <div className="space-y-1">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Passed</p>
              <p className="text-3xl font-display text-pass">{results.pass}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Failed</p>
              <p className="text-3xl font-display text-fail">{results.fail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
          >
            Return to Deck
          </button>
        </motion.div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = Math.min(timeElapsed / TIMER_DURATION, 1);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const getTimerColor = () => {
    if (timeElapsed <= 30) return '#10b981';
    if (timeElapsed <= 45) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Top Bar */}
      <header className="relative z-10 px-4 pt-4 pb-2 flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs font-medium"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">End Challenge</span>
          <span className="sm:hidden">End</span>
        </button>

        {/* Circular Timer */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <motion.circle
              cx="26" cy="26" r={radius} fill="none"
              stroke={getTimerColor()}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.3, ease: 'linear' }}
              style={{ filter: `drop-shadow(0 0 4px ${getTimerColor()}40)` }}
            />
          </svg>
          <span className="absolute text-[10px] font-mono text-gray-300 font-medium">
            {Math.floor(timeElapsed)}
          </span>
        </div>

        <div className="text-gray-500 font-mono text-xs">
          {currentIndex + 1}/{cards.length}
        </div>
      </header>

      {/* Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-4">
        <div className="w-full max-w-lg perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.03, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full relative preserve-3d cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ aspectRatio: '3 / 2' }}
            >
              <motion.div
                animate={{ rotateX: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-white/10 shadow-xl">
                  {currentCard.isStruggling && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 text-fail/70 text-xs">
                      <AlertTriangle size={12} />
                    </div>
                  )}
                  <h2 className="text-xl md:text-2xl font-display font-medium text-white leading-snug">
                    {currentCard.front}
                  </h2>
                  <p className="text-gray-600 text-xs absolute bottom-3 flex items-center gap-1">
                    <RotateCcw size={11} /> Tap to reveal
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 backface-hidden glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-accent-blue/20 shadow-xl"
                  style={{ transform: 'rotateX(180deg)' }}
                >
                  <h2 className="text-lg md:text-xl font-sans font-medium text-white leading-relaxed">
                    {currentCard.back.split(' ').map((word, i) => (
                      word.length > 5
                        ? <span key={i} className="text-accent-blue">{word} </span>
                        : <span key={i}>{word} </span>
                    ))}
                  </h2>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pass/Fail Controls */}
        <div className="mt-6 h-16 flex items-center justify-center gap-3 w-full max-w-sm">
          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 w-full"
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAction('fail'); }}
                  className="flex-1 py-2.5 rounded-xl bg-fail/10 text-fail border border-fail/20 hover:bg-fail hover:text-white transition-all flex items-center justify-center gap-1.5 font-semibold text-sm"
                >
                  <X size={16} /> Fail
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAction('pass'); }}
                  className="flex-1 py-2.5 rounded-xl bg-pass/10 text-pass border border-pass/20 hover:bg-pass hover:text-white transition-all flex items-center justify-center gap-1.5 font-semibold text-sm"
                >
                  <Check size={16} /> Pass
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
