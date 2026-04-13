import { Card } from '../types';

// FSRS threshold constants (from PRD)
const STABILITY_LEARNING = 3;   // < 3 days → Learning
const STABILITY_REVIEW = 10;    // 3-10 days → Review, > 10 → Mastered

// Initial values for new cards
const INITIAL_STABILITY = 0.5;  // Half a day
const INITIAL_DIFFICULTY = 5;   // Mid-range difficulty

// FSRS parameters (tuned for Senko's binary Pass/Fail system)
const PASS_MULTIPLIER = 2.0;     // Stability multiplier on pass
const FAIL_RESET = 0.5;          // Reset stability to this on fail
const DIFFICULTY_STEP = 0.5;     // How much difficulty changes per review
const MAX_DIFFICULTY = 10;
const MIN_DIFFICULTY = 1;

export type FsrsResult = 'learning' | 'review' | 'mastered';

/**
 * Derive the human-readable label from FSRS stability.
 * Labels are system-driven — users cannot manually change them.
 */
export function getLabel(stability: number): FsrsResult {
  if (stability < STABILITY_LEARNING) return 'learning';
  if (stability < STABILITY_REVIEW) return 'review';
  return 'mastered';
}

/**
 * Create a brand new card with default FSRS values.
 */
export function createNewCard(id: string, front: string, back: string): Card {
  return {
    id,
    front,
    back,
    status: 'new',
    stability: INITIAL_STABILITY,
    difficulty: INITIAL_DIFFICULTY,
    lastReviewed: undefined,
  };
}

/**
 * Process a PASS result: increase stability, decrease difficulty slightly.
 * Returns the updated card with new status derived from stability.
 */
export function applyPass(card: Card): Card {
  const now = new Date().toISOString();

  // Increase stability proportionally (higher difficulty = smaller boost)
  const difficultyFactor = 1 + (MAX_DIFFICULTY - card.difficulty) / MAX_DIFFICULTY;
  const newStability = card.stability * PASS_MULTIPLIER * difficultyFactor;
  const clampedStability = Math.min(newStability, 365); // Cap at 1 year

  // Decrease difficulty slightly (easier to remember)
  const newDifficulty = Math.max(MIN_DIFFICULTY, card.difficulty - DIFFICULTY_STEP);

  return {
    ...card,
    stability: clampedStability,
    difficulty: Math.round(newDifficulty * 100) / 100,
    status: getLabel(clampedStability),
    lastReviewed: now,
  };
}

/**
 * Process a FAIL result: reset stability, increase difficulty.
 * Returns the updated card with new status derived from stability.
 */
export function applyFail(card: Card): Card {
  const now = new Date().toISOString();

  // Reset stability to initial value (needs re-learning)
  const newStability = FAIL_RESET;

  // Increase difficulty (harder to remember)
  const newDifficulty = Math.min(MAX_DIFFICULTY, card.difficulty + DIFFICULTY_STEP);

  // Determine downgrade path based on current status
  let newStatus: Card['status'] = 'learning';
  if (card.status === 'mastered') {
    // Gradual downgrade: Mastered → Review → Learning
    newStatus = 'review';
    // Give a small stability bump so it's not instantly learning
    const gentleStability = STABILITY_REVIEW * 0.5;
    return {
      ...card,
      stability: gentleStability,
      difficulty: Math.round(newDifficulty * 100) / 100,
      status: getLabel(gentleStability),
      lastReviewed: now,
    };
  }

  return {
    ...card,
    stability: newStability,
    difficulty: Math.round(newDifficulty * 100) / 100,
    status: newStatus,
    lastReviewed: now,
  };
}

/**
 * Compute next review interval in days based on current stability.
 * Used to schedule when the card should next appear.
 */
export function getNextInterval(card: Card): number {
  // For new cards, show again immediately
  if (card.status === 'new') return 0;

  // Interval = stability (days until ~90% recall)
  return Math.round(card.stability);
}

/**
 * Count cards by label across all decks.
 */
export function countByLabel(cards: Card[]) {
  return {
    new: cards.filter(c => c.status === 'new').length,
    learning: cards.filter(c => c.status === 'learning').length,
    review: cards.filter(c => c.status === 'review').length,
    mastered: cards.filter(c => c.status === 'mastered').length,
  };
}

/**
 * Compute retention percentage across all decks.
 */
export function computeRetention(cards: Card[]): number {
  if (cards.length === 0) return 0;
  const total = cards.length;
  const mastered = cards.filter(c => c.status === 'mastered').length;
  const reviewing = cards.filter(c => c.status === 'review').length;
  // Weighted: mastered = 100%, review = 50%, learning/new = 0%
  const score = (mastered * 100 + reviewing * 50) / total;
  return Math.round(score);
}
