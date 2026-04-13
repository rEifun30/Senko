import { useState, useRef, ChangeEvent, useCallback, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, Zap, Clock, Layers, Edit2, Save, X, AlertTriangle, Check, Trash2, FileUp, FileDown } from 'lucide-react';
import { Deck, Card } from '../types';
import { useDecks } from '../contexts/DeckContext';
import DropZone from './DropZone';

interface DeckViewProps {
  deck: Deck;
  onBack: () => void;
  onStartStudy: () => void;
  onStartChallenge: () => void;
}

export default function DeckView({ deck, onBack, onStartStudy, onStartChallenge }: DeckViewProps) {
  const { deleteCard, addCard, exportDeckToCsv, importCsvIntoDeck, updateCard } = useDecks();
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [importError, setImportError] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deck-level drag & drop handlers
  const handleDeckDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDeckDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  }, []);

  const handleDeckDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDeckDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    if (!isCsv) {
      setImportError('Please upload a valid CSV file.');
      setShowImport(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string)?.replace(/^\uFEFF/, '');
      if (text) {
        setCsvInput(text);
        setShowImport(true);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  // DropZone callbacks for import modal
  const handleDropZoneFile = useCallback((text: string, _fileName: string) => {
    setCsvInput(text);
    setImportError('');
  }, []);

  const handleDropZoneError = useCallback((msg: string) => {
    setImportError(msg);
  }, []);

  const statusCounts = {
    new: deck.cards.filter(c => c.status === 'new').length,
    learning: deck.cards.filter(c => c.status === 'learning').length,
    review: deck.cards.filter(c => c.status === 'review').length,
    mastered: deck.cards.filter(c => c.status === 'mastered').length,
    struggling: deck.cards.filter(c => c.isStruggling).length,
  };

  const isEmpty = deck.cards.length === 0;

  const startEdit = (card: Card) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const saveEdit = () => {
    if (!editingCardId || !editFront.trim() || !editBack.trim()) return;
    updateCard(deck.id, editingCardId, { front: editFront.trim(), back: editBack.trim() });
    setEditingCardId(null);
  };

  const toggleStruggling = (cardId: string) => {
    updateCard(deck.id, cardId, { isStruggling: !deck.cards.find(c => c.id === cardId)?.isStruggling });
  };

  const handleAddCard = () => {
    if (!newFront.trim() || !newBack.trim()) return;
    addCard(deck.id, { id: `card_${Date.now()}`, front: newFront.trim(), back: newBack.trim(), status: 'new', stability: 0.5, difficulty: 5 });
    setNewFront('');
    setNewBack('');
    setShowAddCard(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') setCsvInput(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImportError('');
    if (!csvInput.trim()) { setImportError('Paste CSV data or upload a file'); return; }
    const count = await importCsvIntoDeck(deck.id, csvInput);
    if (count > 0) {
      setShowImport(false);
      setCsvInput('');
    } else {
      setImportError('Could not parse CSV. Ensure front,back format.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto p-6 md:p-8 space-y-6 relative"
      onDragEnter={handleDeckDragEnter}
      onDragLeave={handleDeckDragLeave}
      onDragOver={handleDeckDragOver}
      onDrop={handleDeckDrop}
    >
      {/* Deck-level drag overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-matte-black/70 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="border-4 border-dashed border-accent-blue rounded-3xl p-16 text-center shadow-[0_0_40px_rgba(59,130,246,0.4)]">
              <FileUp size={48} className="mx-auto mb-4 text-accent-blue" />
              <p className="text-xl font-display font-semibold text-white">Drop CSV to add cards</p>
              <p className="text-sm text-gray-400 mt-2">Adds to &quot;{deck.title}&quot;</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white">{deck.title}</h1>
        {deck.description && <p className="text-gray-400">{deck.description}</p>}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-gray-300">
          <Layers size={13} className="text-accent-blue" />
          <span>{deck.cards.length} Card{deck.cards.length !== 1 ? 's' : ''}</span>
        </div>
        {deck.lastStudied && (
          <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-gray-300">
            <Clock size={13} className="text-orange-400" />
            <span>Last: {deck.lastStudied}</span>
          </div>
        )}
        {statusCounts.struggling > 0 && (
          <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-fail/80">
            <AlertTriangle size={13} />
            <span>{statusCounts.struggling} struggling</span>
          </div>
        )}
      </div>

      {/* Status summary */}
      <div className="glass-panel p-4 rounded-xl grid grid-cols-4 gap-3 text-center">
        <StatusPill label="New" count={statusCounts.new} color="text-gray-400" bg="bg-gray-500/10" />
        <StatusPill label="Learning" count={statusCounts.learning} color="text-accent-blue" bg="bg-accent-blue/10" />
        <StatusPill label="Review" count={statusCounts.review} color="text-orange-400" bg="bg-orange-500/10" />
        <StatusPill label="Mastered" count={statusCounts.mastered} color="text-pass" bg="bg-pass/10" />
      </div>

      {/* Study / Challenge */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          whileHover={!isEmpty ? { scale: 1.03, y: -6, rotateX: 2 } : undefined}
          whileTap={!isEmpty ? { scale: 0.97 } : undefined}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={isEmpty ? undefined : onStartStudy}
          className={`glass-panel p-6 rounded-2xl cursor-pointer group relative overflow-hidden border border-white/5 transition-all ${isEmpty ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent-blue/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]'}`}
          style={{ perspective: '600px' }}
        >
          {/* Animated glow background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          />
          {/* Animated top border sweep */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            whileHover={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-0 right-0 p-6 opacity-5 transition-opacity text-accent-blue"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Play size={60} />
          </motion.div>
          <div className="relative z-10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center text-accent-blue">
              <Play size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Study Mode</h2>
              <p className="text-gray-400 text-xs mt-1">Passive review. No timers, flip freely.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={!isEmpty ? { scale: 1.03, y: -6, rotateX: 2 } : undefined}
          whileTap={!isEmpty ? { scale: 0.97 } : undefined}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={isEmpty ? undefined : onStartChallenge}
          className={`glass-panel p-6 rounded-2xl cursor-pointer group relative overflow-hidden border border-white/5 transition-all ${isEmpty ? 'opacity-40 cursor-not-allowed' : 'hover:border-fail/50 hover:shadow-[0_8px_32px_rgba(239,68,68,0.15)]'}`}
          style={{ perspective: '600px' }}
        >
          {/* Animated glow background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-fail/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          />
          {/* Animated top border sweep */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fail to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            whileHover={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-0 right-0 p-6 opacity-5 transition-opacity text-fail"
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Zap size={60} />
          </motion.div>
          <div className="relative z-10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-fail/20 flex items-center justify-center text-fail">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Challenge Mode</h2>
              <p className="text-gray-400 text-xs mt-1">Active recall. Pass or fail. FSRS optimized.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add card form - rendered at root level so it works for both empty and non-empty decks */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel p-4 rounded-xl space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-white font-medium">Add a new card</p>
              <button
                onClick={() => setShowAddCard(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="Front (question)"
              className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50"
            />
            <input
              type="text"
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Back (answer)"
              className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newFront.trim() || !newBack.trim()}
                className="flex items-center gap-1 bg-accent-blue text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Check size={12} /> Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty Deck State */}
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-10 rounded-2xl text-center space-y-6 border border-accent-blue/20"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-blue/10 flex items-center justify-center">
            <Layers size={28} className="text-accent-blue" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-white">This deck is empty</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
              Import a CSV file or add cards manually to get started.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowImport(true)}
              className="bg-accent-blue hover:bg-accent-blue/80 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              <FileUp size={16} /> Import CSV
            </button>
            <button
              onClick={() => setShowAddCard(true)}
              className="glass-panel hover:bg-white/10 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              <Edit2 size={16} /> Add Card Manually
            </button>
          </div>
        </motion.div>
      )}

      {/* Card List */}
      {!isEmpty && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-white">Cards</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportDeckToCsv(deck.id)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 flex items-center gap-1"
              >
                <FileDown size={11} /> Export
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 flex items-center gap-1"
              >
                <FileUp size={11} /> Import
              </button>
              <button
                onClick={() => setShowAddCard(!showAddCard)}
                className="text-xs text-accent-blue hover:underline font-medium"
              >
                + Add Card
              </button>
            </div>
          </div>

          {/* Card rows */}
          <div className="space-y-1.5">
            <AnimatePresence>
              {deck.cards.map((card, idx) => {
                const isEditing = editingCardId === card.id;
                return (
                  <motion.div key={card.id} layout className="glass-panel rounded-xl overflow-hidden">
                    {isEditing ? (
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={editFront}
                          onChange={(e) => setEditFront(e.target.value)}
                          className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                          placeholder="Front"
                        />
                        <input
                          type="text"
                          value={editBack}
                          onChange={(e) => setEditBack(e.target.value)}
                          className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                          placeholder="Back"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="flex items-center gap-1 bg-accent-blue text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                            <Save size={12} /> Save
                          </button>
                          <button onClick={() => setEditingCardId(null)} className="flex items-center gap-1 glass-panel text-gray-400 text-xs px-3 py-1.5 rounded-lg">
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-gray-600 font-mono text-xs shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                          <div className="min-w-0">
                            <p className="text-gray-200 text-sm font-medium truncate">{card.front}</p>
                            <p className="text-gray-500 text-xs truncate">{card.back}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleStruggling(card.id)}
                            className={`p-1 rounded transition-colors ${card.isStruggling ? 'text-fail bg-fail/10' : 'text-gray-600 hover:text-fail/60'}`}
                            title="Toggle struggling"
                          >
                            <AlertTriangle size={13} />
                          </button>
                          <StatusBadge status={card.status} />
                          <button onClick={() => startEdit(card)} className="p-1 text-gray-500 hover:text-white transition-colors" title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => deleteCard(deck.id, card.id)} className="p-1 text-gray-600 hover:text-fail transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Import CSV Modal - always rendered, works for both empty and non-empty decks */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-matte-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowImport(false); setCsvInput(''); setImportError(''); }}
          >
            <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-white">Import CSV</h3>
                <button onClick={() => { setShowImport(false); setCsvInput(''); setImportError(''); }} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="text-gray-400 text-xs">Add cards to &quot;{deck.title}&quot;. Existing cards won&apos;t be affected.</p>

              <DropZone
                onFile={handleDropZoneFile}
                onError={handleDropZoneError}
                label="Drag & drop your CSV file here"
                sublabel="Supports all languages (UTF-8) — or click to browse"
                className="py-8"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="mt-2 text-xs text-accent-blue hover:underline"
                >
                  Browse files
                </button>
              </DropZone>

              <p className="text-xs text-gray-500 text-center">Or paste CSV data below:</p>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder={`front,back\n猫 (ねこ),Cat\n안녕,Hello\n你好,Hello`}
                rows={6}
                className="w-full bg-surface border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 font-mono resize-none"
              />
              {importError && <p className="text-fail text-xs">{importError}</p>}
              <div className="flex gap-2">
                <button onClick={handleImport} className="bg-accent-blue text-white text-xs font-medium px-4 py-2 rounded-lg">Import</button>
                <button onClick={() => { setShowImport(false); setCsvInput(''); setImportError(''); }} className="glass-panel text-gray-400 text-xs px-4 py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-gray-500/15 text-gray-500',
    learning: 'bg-accent-blue/15 text-accent-blue',
    review: 'bg-orange-500/15 text-orange-400',
    mastered: 'bg-pass/15 text-pass',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${colors[status] || colors.new}`}>
      {status}
    </span>
  );
}

function StatusPill({ label, count, color, bg }: { label: string, count: number, color: string, bg: string }) {
  return (
    <div className={`${bg} rounded-lg py-2`}>
      <p className={`text-lg font-display font-semibold ${color}`}>{count}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
