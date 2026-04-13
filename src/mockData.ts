import { Deck } from './types';

export const mockDecks: Deck[] = [
  {
    id: '1',
    title: 'Japanese N5 Vocabulary',
    description: 'Basic vocabulary for JLPT N5',
    lastStudied: '2026-04-09',
    cards: [
      { id: 'c1', front: '猫 (ねこ)', back: 'Cat', status: 'mastered', stability: 15, difficulty: 2 },
      { id: 'c2', front: '犬 (いぬ)', back: 'Dog', status: 'review', stability: 5, difficulty: 4 },
      { id: 'c3', front: '水 (みず)', back: 'Water', status: 'learning', stability: 1, difficulty: 7 },
      { id: 'c4', front: '食べる (たべる)', back: 'To eat', status: 'new', stability: 0.5, difficulty: 5 },
      { id: 'c5', front: '飲む (のむ)', back: 'To drink', status: 'new', stability: 0.5, difficulty: 5 },
    ],
  },
  {
    id: '2',
    title: 'React Fundamentals',
    description: 'Core concepts of React.js',
    lastStudied: '2026-04-08',
    cards: [
      { id: 'c6', front: 'What is a Hook?', back: 'A special function that lets you "hook into" React features.', status: 'mastered', stability: 20, difficulty: 1 },
      { id: 'c7', front: 'useEffect purpose?', back: 'To perform side effects in function components.', status: 'review', stability: 7, difficulty: 3 },
      { id: 'c8', front: 'useState return value?', back: 'An array with the current state and a function to update it.', status: 'learning', stability: 1.5, difficulty: 6 },
    ],
  },
];
