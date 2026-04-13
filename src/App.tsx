import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import Intro from './components/Intro';
import Dashboard from './components/Dashboard';
import DeckView from './components/DeckView';
import StudyMode from './components/StudyMode';
import ChallengeMode from './components/ChallengeMode';
import AuthForm from './components/AuthForm';
import { useAuth } from './contexts/AuthContext';
import { useDecks } from './contexts/DeckContext';
import { useStudyActivity } from './contexts/StudyActivityContext';
import { Card, Deck } from './types';

type ViewState = 'intro' | 'auth' | 'dashboard' | 'deck' | 'study' | 'challenge';

function AppContent() {
  const { user, isGuest, loading, continueAsGuest, signOut } = useAuth();
  const { getDeck, updateCard, updateDeckLastStudied } = useDecks();
  const { recordStudy } = useStudyActivity();
  const [view, setView] = useState<ViewState>('intro');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  const activeDeck = activeDeckId ? getDeck(activeDeckId) : null;

  useEffect(() => {
    if (!introComplete) return;
    if (loading) return;
    if (user || isGuest) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  }, [introComplete, user, isGuest, loading]);

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);
  const handleGuestContinue = useCallback(() => continueAsGuest(), [continueAsGuest]);
  const handleShowAuth = useCallback(() => setShowAuth(true), []);
  const handleCloseAuth = useCallback(() => setShowAuth(false), []);

  const handleSelectDeck = useCallback((deckId: string) => {
    setActiveDeckId(deckId);
    setView('deck');
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setActiveDeckId(null);
    setView('auth');
  }, [signOut]);

  const handleUpdateCard = useCallback((cardId: string, updates: Partial<Card>) => {
    if (!activeDeckId) return;
    updateCard(activeDeckId, cardId, updates);
  }, [activeDeckId, updateCard]);

  const handleUpdateDeckLastStudied = useCallback((deckId: string) => {
    updateDeckLastStudied(deckId);
  }, [updateDeckLastStudied]);

  const handleRecordStudy = useCallback((cardsCount: number) => {
    recordStudy(cardsCount);
  }, [recordStudy]);

  if (!introComplete) {
    return <Intro onComplete={handleIntroComplete} />;
  }

  if (view === 'auth' && !user && !isGuest) {
    return (
      <div className="min-h-screen bg-matte-black text-gray-100 font-sans selection:bg-accent-blue/30">
        <AuthForm
          onClose={handleCloseAuth}
          onGuestContinue={handleGuestContinue}
        />
      </div>
    );
  }

  const showAuthOverlay = showAuth && !user;

  return (
    <div className="min-h-screen bg-matte-black text-gray-100 font-sans selection:bg-accent-blue/30">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <Dashboard
            onSelectDeck={handleSelectDeck}
            onSignOut={handleSignOut}
            onShowAuth={handleShowAuth}
          />
        )}

        {view === 'deck' && activeDeck && (
          <DeckView
            key={activeDeck.id}
            deck={activeDeck}
            onBack={() => setView('dashboard')}
            onStartStudy={() => setView('study')}
            onStartChallenge={() => setView('challenge')}
          />
        )}

        {view === 'study' && activeDeck && (
          <StudyMode
            key={`study-${activeDeck.id}`}
            deck={activeDeck}
            onExit={() => setView('deck')}
          />
        )}

        {view === 'challenge' && activeDeck && (
          <ChallengeMode
            key={`challenge-${activeDeck.id}`}
            deck={activeDeck}
            onExit={() => setView('deck')}
            onUpdateCard={handleUpdateCard}
            onUpdateDeckLastStudied={handleUpdateDeckLastStudied}
            onRecordStudy={handleRecordStudy}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthOverlay && (
          <AuthForm
            onClose={handleCloseAuth}
            onGuestContinue={handleCloseAuth}
            initialMode="signup"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
