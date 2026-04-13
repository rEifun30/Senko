import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface IntroProps {
  onComplete: () => void;
}

export default function Intro({ onComplete }: IntroProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0: SENKO appears (0-0.3s)
    // Phase 1: Blue light sweeps across immediately (0.3s-2.3s)
    // Phase 2: Tagline fades in (2.3s-2.9s)
    // Phase 3: Fade to black (3.4s)
    // Phase 4: Done (3.8s)
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2300),
      setTimeout(() => setPhase(3), 3400),
      setTimeout(() => setPhase(4), 3800),
      setTimeout(() => onComplete(), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-matte-black z-50 overflow-hidden">
      {/* Background particles */}
      {phase >= 1 && phase <= 3 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent-blue/20"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                opacity: 0,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [null, `-${30 + Math.random() * 60}`],
              }}
              transition={{
                duration: 1.5 + Math.random() * 1,
                delay: Math.random() * 0.8,
                repeat: 1,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Main SENKO text */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        {/* Base layer (dim) */}
        <h1 className="font-display text-7xl md:text-9xl font-bold tracking-tighter text-white/10 relative z-10">
          SENKO
        </h1>

        {/* Blue light sweep - fades out after crossing right */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ left: '-150%', opacity: 0 }}
              animate={{
                left: ['-50%', '200%'],
                opacity: [0, 0.7, 0.7, 0],
              }}
              transition={{
                left: { duration: 2, ease: 'easeInOut' },
                opacity: { duration: 2, times: [0, 0.3, 0.7, 1] },
              }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-accent-blue/80 to-accent-blue/30 z-20 mix-blend-screen"
              style={{ filter: 'blur(24px)' }}
            />
          )}
        </AnimatePresence>

        {/* Reveal layer (white text, clipped) */}
        <motion.h1
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 -100% 0 0)' }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
          className="font-display text-7xl md:text-9xl font-bold tracking-tighter text-white absolute top-0 left-0 z-30"
        >
          SENKO
        </motion.h1>
      </motion.div>

      {/* Glow line under text */}
      {phase >= 1 && phase <= 3 && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="h-px bg-gradient-to-r from-transparent via-accent-blue to-transparent z-30 mt-4 w-64 md:w-96"
          style={{ transformOrigin: 'center' }}
        />
      )}

      {/* Tagline */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center z-30 mt-6"
          >
            <p className="text-gray-400 text-sm md:text-base font-sans tracking-wide">
              Minimalist flashcards. Powered by spaced repetition.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade out overlay */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-matte-black z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
