export interface Card {
  id: string;
  front: string;
  back: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  stability: number;    // FSRS: days until 90% recall probability
  difficulty: number;   // FSRS: 1-10, how hard the card is
  lastReviewed?: string;
  isStruggling?: boolean;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  lastStudied?: string;
  user_id?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  isGuest: boolean;
}

export interface UserStats {
  studiedToday: number;
  totalLearned: number;
  accuracy: number;
  currentStreak: number;
  masteredCount: number;
  learningCount: number;
  reviewCount: number;
}

export type AuthMode = 'signin' | 'signup';
