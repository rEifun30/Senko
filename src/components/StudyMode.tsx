import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shuffle, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Deck, Card } from '../types';

interface StudyModeProps {
  deck: Deck;
  onExit: () => void;
}

export default function StudyMode({ deck, onExit }: StudyModeProps) {
  const [shuffleKey, setShuffleKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Memoize shuffled cards - recalculates when shuffleKey changes
  const cards = useMemo(() => {
    const arr = [...deck.cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [deck.cards, shuffleKey]);

  const handleShuffle = () => {
    setShuffleKey(k => k + 1);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 text-lg mb-4">No cards in this deck</p>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

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
          <span>Exit</span>
        </button>
        <div className="text-gray-500 font-mono text-xs">
          {currentIndex + 1} / {cards.length}
        </div>
        <button
          type="button"
          onClick={handleShuffle}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          title="Shuffle"
        >
          <Shuffle size={16} />
        </button>
      </header>

      {/* Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
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
                      <span>Struggling</span>
                    </div>
                  )}
                  <h2 className="text-xl md:text-2xl font-display font-medium text-white leading-snug">
                    {currentCard.front}
                  </h2>
                  <p className="text-gray-600 text-xs absolute bottom-3">Tap to reveal</p>
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

        {/* Controls */}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={nextCard}
            disabled={currentIndex === cards.length - 1}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
