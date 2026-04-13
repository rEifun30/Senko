import { useState, useRef, ChangeEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Check, ChevronLeft, FileUp } from 'lucide-react';
import { useDecks } from '../contexts/DeckContext';
import { Card } from '../types';
import DropZone from './DropZone';

interface CreateDeckProps {
  onClose: () => void;
  onCreated: () => void;
}

type Step = 'details' | 'cards' | 'import';

export default function CreateDeck({ onClose, onCreated }: CreateDeckProps) {
  const { createDeck, importCsvAsNewDeck } = useDecks();
  const [step, setStep] = useState<Step>('details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddCard = () => {
    if (!front.trim() || !back.trim()) return;
    setCards(prev => [...prev, {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      front: front.trim(),
      back: back.trim(),
      status: 'new',
      stability: 0.5,
      difficulty: 5,
    }]);
    setFront('');
    setBack('');
  };

  const handleRemoveCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDropZoneFile = useCallback((text: string, _fileName: string) => {
    setCsvText(text);
    setImportError(null);
  }, []);

  const handleDropZoneError = useCallback((msg: string) => {
    setImportError(msg);
  }, []);

  const handleImport = async () => {
    setImportError(null);
    if (!csvText.trim()) {
      setImportError('Please paste CSV data or upload a file');
      return;
    }
    const result = await importCsvAsNewDeck(csvText);
    if (result) {
      onCreated();
    } else {
      setImportError('Could not parse CSV. Make sure it has front and back columns.');
    }
  };

  const handleCreate = () => {
    const deckTitle = title.trim() || 'Untitled Deck';
    createDeck(deckTitle, description.trim(), cards);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-matte-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-panel rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step !== 'details' && (
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="font-display text-xl font-semibold text-white">
              {step === 'details' && 'Create New Deck'}
              {step === 'cards' && `Add Cards (${cards.length})`}
              {step === 'import' && 'Import from CSV'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">Deck Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Japanese N5 Vocabulary"
                  className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this deck about?"
                  rows={2}
                  className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 resize-none"
                />
              </div>
              <div className="space-y-3 pt-4">
                <p className="text-sm text-gray-400">How would you like to add cards?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('cards')}
                    className="glass-panel p-4 rounded-xl text-center hover:border-accent-blue/50 transition-colors cursor-pointer"
                  >
                    <Plus size={24} className="mx-auto mb-2 text-accent-blue" />
                    <p className="text-white text-sm font-medium">Manual Entry</p>
                    <p className="text-gray-500 text-xs mt-1">Add cards one by one</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('import')}
                    className="glass-panel p-4 rounded-xl text-center hover:border-accent-blue/50 transition-colors cursor-pointer"
                  >
                    <FileUp size={24} className="mx-auto mb-2 text-accent-blue" />
                    <p className="text-white text-sm font-medium">CSV Import</p>
                    <p className="text-gray-500 text-xs mt-1">Bulk import from file</p>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!title.trim()}
                  className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create empty deck (add cards later)
                </button>
              </div>
            </div>
          )}

          {/* Step: Cards */}
          {step === 'cards' && (
            <div className="space-y-6">
              {/* Deck Title */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">Deck Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Japanese N5 Vocabulary"
                  className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">Front</label>
                  <input
                    type="text"
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="Question or prompt"
                    className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">Back</label>
                  <textarea
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="Answer or explanation"
                    rows={2}
                    className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCard}
                  disabled={!front.trim() || !back.trim()}
                  className="w-full bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={18} /> Add Card
                </button>
              </div>

              {cards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">{cards.length} card{cards.length !== 1 ? 's' : ''} in deck</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <AnimatePresence>
                      {cards.map((card) => (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center justify-between bg-surface/50 rounded-lg p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{card.front}</p>
                            <p className="text-xs text-gray-500 truncate">{card.back}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(card.id)}
                            className="text-gray-500 hover:text-fail transition-colors ml-2 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {cards.length > 0 && (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="w-full bg-pass hover:bg-pass/80 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={18} /> Create Deck with {cards.length} Card{cards.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Step: Import */}
          {step === 'import' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Paste CSV data below or drop a file. The app will auto-detect front/back columns.
              </p>

              <DropZone
                onFile={handleDropZoneFile}
                onError={handleDropZoneError}
                label="Drag & drop your CSV file here"
                sublabel="Supports all languages (UTF-8) — or click to browse"
                className="py-6"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="mt-2 text-xs text-accent-blue hover:underline cursor-pointer"
                >
                  Browse files
                </button>
              </DropZone>

              <p className="text-xs text-gray-500 text-center">Or paste CSV data below:</p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`front,back\n猫 (ねこ),Cat\n안녕,Hello\n你好,Hello`}
                rows={8}
                className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 resize-none font-mono text-sm"
              />

              {importError && (
                <p className="text-fail text-sm">{importError}</p>
              )}

              <button
                type="button"
                onClick={handleImport}
                className="w-full bg-accent-blue hover:bg-accent-blue/80 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Import Deck
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
