import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Deck, Card } from '../types';
import { mockDecks } from '../mockData';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';
import { createNewCard } from '../utils/fsrs';

const STORAGE_KEY = 'senko_decks';

interface DeckContextType {
  decks: Deck[];
  loading: boolean;
  getDeck: (deckId: string) => Deck | undefined;
  createDeck: (title: string, description: string, cards: Card[]) => Promise<Deck>;
  updateDeckTitle: (deckId: string, title: string, description?: string) => void;
  updateDeckLastStudied: (deckId: string) => void;
  deleteDeck: (deckId: string) => void;
  addCard: (deckId: string, card: Card) => void;
  updateCard: (deckId: string, cardId: string, updates: Partial<Card>) => void;
  deleteCard: (deckId: string, cardId: string) => void;
  exportDeckToCsv: (deckId: string) => void;
  importCsvIntoDeck: (deckId: string, csvText: string) => Promise<number>;
  importCsvAsNewDeck: (csvText: string) => Promise<Deck | null>;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

function loadFromStorage(): Deck[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old cards: add missing FSRS fields
      return parsed.map((deck: Deck) => ({
        ...deck,
        cards: deck.cards.map((card: Card) => ({
          stability: card.stability ?? 0.5,
          difficulty: card.difficulty ?? 5,
          lastReviewed: card.lastReviewed,
          ...card,
        })),
      }));
    }
  } catch {
    console.warn('Failed to load decks from localStorage');
  }
  return mockDecks;
}

function saveToStorage(decks: Deck[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    console.warn('Failed to save decks to localStorage');
  }
}

export function DeckProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      const stored = loadFromStorage();
      setDecks(stored);
      setLoading(false);
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    if (initialized) saveToStorage(decks);
  }, [decks, initialized]);

  // Sync to Supabase
  useEffect(() => {
    if (!user || isGuest || !initialized) return;
    const syncDecks = async () => {
      try {
        for (const deck of decks) {
          await supabase.from('decks').upsert({
            id: deck.id,
            user_id: user.id,
            title: deck.title,
            description: deck.description,
            last_studied: deck.lastStudied || null,
          }, { onConflict: 'id' });
        }
      } catch (err) {
        console.error('Failed to sync decks:', err);
      }
    };
    syncDecks();
  }, [decks, user, isGuest, initialized]);

  const getDeck = useCallback((deckId: string) => {
    return decks.find(d => d.id === deckId);
  }, [decks]);

  const createDeck = useCallback(async (title: string, description: string, cards: Card[]): Promise<Deck> => {
    const newDeck: Deck = {
      id: `deck_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      cards,
      created_at: new Date().toISOString(),
      lastStudied: undefined,
    };
    setDecks(prev => [newDeck, ...prev]);
    return newDeck;
  }, []);

  const updateDeckTitle = useCallback((deckId: string, title: string, description?: string) => {
    setDecks(prev => prev.map(d =>
      d.id === deckId ? { ...d, title, ...(description !== undefined ? { description } : {}) } : d
    ));
  }, []);

  const updateDeckLastStudied = useCallback((deckId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setDecks(prev => prev.map(d =>
      d.id === deckId ? { ...d, lastStudied: today } : d
    ));
  }, []);

  const deleteDeck = useCallback((deckId: string) => {
    setDecks(prev => prev.filter(d => d.id !== deckId));
  }, []);

  const addCard = useCallback((deckId: string, card: Card) => {
    setDecks(prev => prev.map(d =>
      d.id === deckId ? { ...d, cards: [...d.cards, card] } : d
    ));
  }, []);

  const updateCard = useCallback((deckId: string, cardId: string, updates: Partial<Card>) => {
    setDecks(prev => prev.map(d =>
      d.id === deckId
        ? { ...d, cards: d.cards.map(c => c.id === cardId ? { ...c, ...updates } : c) }
        : d
    ));
  }, []);

  const deleteCard = useCallback((deckId: string, cardId: string) => {
    setDecks(prev => prev.map(d =>
      d.id === deckId ? { ...d, cards: d.cards.filter(c => c.id !== cardId) } : d
    ));
  }, []);

  const exportDeckToCsv = useCallback((deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    // Build CSV with proper escaping for multilingual content
    const escapeCsvField = (val: string) => {
      // If field contains comma, quote, or newline, wrap in quotes
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvRows = [
      'front,back',
      ...deck.cards.map(c => `${escapeCsvField(c.front)},${escapeCsvField(c.back)}`),
    ];
    const csvContent = csvRows.join('\r\n'); // CRLF for Excel compatibility

    // Prepend UTF-8 BOM so Excel and other tools open it correctly with CJK/RTL text
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [decks]);

  const parseCsv = useCallback((csvText: string): Card[] => {
    // Remove UTF-8 BOM if present (ensures multilingual compatibility)
    const cleanText = csvText.replace(/^\uFEFF/, '');
    const lines = cleanText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    // Parse headers: split by comma, remove surrounding quotes, lowercase for matching
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

    let frontIdx = headers.findIndex(h => ['front', 'question', 'prompt', 'q', 'term', 'kanji', 'front side'].includes(h));
    let backIdx = headers.findIndex(h => ['back', 'answer', 'response', 'a', 'definition', 'meaning', 'reading', 'back side'].includes(h));
    // Fallback: first two columns
    if (frontIdx === -1) frontIdx = 0;
    if (backIdx === -1) backIdx = 1;

    const cards: Card[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      // Parse CSV line handling quoted fields (preserves commas and special chars inside quotes)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          // Handle escaped quotes ("")
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      // Extract front/back values, only remove surrounding quotes (preserve all internal text including CJK, RTL, etc.)
      const frontVal = (values[frontIdx] || '').replace(/^"|"$/g, '');
      const backVal = (values[backIdx] || '').replace(/^"|"$/g, '');

      if (frontVal && backVal) {
        const newCard: Card = {
          id: `card_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
          front: frontVal,
          back: backVal,
          status: 'new',
          stability: 0.5,
          difficulty: 5,
        };
        cards.push(newCard);
      }
    }
    return cards;
  }, []);

  const importCsvIntoDeck = useCallback(async (deckId: string, csvText: string): Promise<number> => {
    const newCards = parseCsv(csvText);
    if (newCards.length === 0) return 0;
    setDecks(prev => prev.map(d =>
      d.id === deckId ? { ...d, cards: [...d.cards, ...newCards] } : d
    ));
    return newCards.length;
  }, [parseCsv]);

  const importCsvAsNewDeck = useCallback(async (csvText: string): Promise<Deck | null> => {
    const cards = parseCsv(csvText);
    if (cards.length === 0) return null;
    const deckTitle = `Imported Deck ${new Date().toLocaleTimeString()}`;
    return createDeck(deckTitle, 'Imported from CSV', cards);
  }, [parseCsv, createDeck]);

  return (
    <DeckContext.Provider
      value={{
        decks,
        loading,
        getDeck,
        createDeck,
        updateDeckTitle,
        updateDeckLastStudied,
        deleteDeck,
        addCard,
        updateCard,
        deleteCard,
        exportDeckToCsv,
        importCsvIntoDeck,
        importCsvAsNewDeck,
      }}
    >
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDecks must be used within a DeckProvider');
  }
  return context;
}
