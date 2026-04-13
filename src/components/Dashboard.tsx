import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Flame, Target, BrainCircuit, Plus, Zap, MoreVertical, Edit2, Trash2, FileUp, FileDown, X, Check, Info, Sparkles } from 'lucide-react';
import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { Deck } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDecks } from '../contexts/DeckContext';
import { useStudyActivity } from '../contexts/StudyActivityContext';
import CreateDeck from './CreateDeck';
import Heatmap from './Heatmap';
import UserProfile from './UserProfile';
import { countByLabel, computeRetention } from '../utils/fsrs';

// Portal-style dropdown
function DeckMenuDropdown({ anchorEl, deck, onSelect }: {
  anchorEl: HTMLElement | null;
  deck: Deck;
  onSelect: (action: string) => void;
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    const update = () => {
      const rect = anchorEl.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6 + window.scrollY,
        right: window.innerWidth - rect.right,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorEl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      className="glass-panel rounded-xl overflow-hidden shadow-xl"
      style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999, width: '176px' }}
    >
      <button type="button" onClick={() => onSelect('edit')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">
        <Edit2 size={13} /> Edit Deck
      </button>
      <button type="button" onClick={() => onSelect('import')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">
        <FileUp size={13} /> Import CSV
      </button>
      <button type="button" onClick={() => onSelect('export')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">
        <FileDown size={13} /> Export CSV
      </button>
      <div className="border-t border-white/5" />
      <button type="button" onClick={() => onSelect('delete')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-fail hover:bg-white/5 transition-colors">
        <Trash2 size={13} /> Delete Deck
      </button>
    </motion.div>
  );
}

interface DashboardProps {
  onSelectDeck: (deckId: string) => void;
  onSignOut: () => void;
  onShowAuth: () => void;
}

export default function Dashboard({ onSelectDeck, onSignOut, onShowAuth }: DashboardProps) {
  const { stats, isGuest, profile } = useAuth();
  const { decks, deleteDeck, updateDeckTitle, importCsvIntoDeck, exportDeckToCsv } = useDecks();
  const { getTodayStudied, getTotalStudied, getStreak } = useStudyActivity();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showImportId, setShowImportId] = useState<string | null>(null);
  const [csvInput, setCsvInput] = useState('');
  const [importError, setImportError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const importDeck = decks.find(d => d.id === showImportId);

  const greeting = isGuest
    ? 'Studying as guest. Sign up to sync your progress across devices.'
    : `Welcome back, ${profile?.email?.split('@')[0] || 'user'}. Ready to enter the flow state?`;

  const allCards = decks.flatMap(d => d.cards);
  const labelCounts = countByLabel(allCards);
  const totalCards = allCards.length || 1;
  const retention = computeRetention(allCards);
  const learningPct = Math.round((labelCounts.learning / totalCards) * 100);
  const reviewPct = Math.round((labelCounts.review / totalCards) * 100);
  const masteredPct = Math.round((labelCounts.mastered / totalCards) * 100);

  const handleDeckCreated = () => setShowCreateDeck(false);

  const startEdit = (deck: Deck) => {
    setEditingDeckId(deck.id);
    setEditTitle(deck.title);
    setEditDesc(deck.description);
    setMenuOpenId(null);
  };

  const saveEdit = () => {
    if (!editingDeckId || !editTitle.trim()) return;
    updateDeckTitle(editingDeckId, editTitle.trim(), editDesc.trim());
    setEditingDeckId(null);
  };

  const handleImport = async (deckId: string) => {
    if (!csvInput.trim()) {
      setImportError('Paste CSV data or upload a file');
      return;
    }
    const count = await importCsvIntoDeck(deckId, csvInput);
    if (count > 0) {
      setShowImportId(null);
      setCsvInput('');
      setImportError('');
    } else {
      setImportError('Could not parse CSV');
    }
  };

  const handleDelete = (deckId: string) => {
    deleteDeck(deckId);
    setDeleteConfirmId(null);
    setMenuOpenId(null);
  };

  const handleMenuAction = useCallback((deck: Deck, action: string) => {
    setMenuOpenId(null);
    if (action === 'edit') startEdit(deck);
    else if (action === 'import') { setShowImportId(deck.id); setCsvInput(''); setImportError(''); }
    else if (action === 'export') exportDeckToCsv(deck.id);
    else if (action === 'delete') setDeleteConfirmId(deck.id);
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const handler = () => setMenuOpenId(null);
    requestAnimationFrame(() => document.addEventListener('mousedown', handler));
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-4 md:p-10 space-y-6 md:space-y-10"
    >
      {/* Header */}
      <header className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">{greeting}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateDeck(true)}
            className="glass-panel hover:bg-white/10 transition-colors px-3 md:px-4 py-2 rounded-full flex items-center gap-2 text-xs md:text-sm font-medium"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Deck</span>
          </button>
          <UserProfile onShowAuth={onShowAuth} />
        </div>
      </header>

      {/* Guest upgrade banner */}
      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-3 md:p-4 rounded-2xl flex items-center justify-between border border-orange-500/20"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <Zap size={18} className="text-orange-400" />
            <div>
              <p className="text-white text-xs md:text-sm font-medium">Unlock full features</p>
              <p className="text-gray-400 text-[10px] md:text-xs">Sign up for deck sync, analytics, streaks, and more</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onShowAuth}
            className="bg-accent-blue hover:bg-accent-blue/80 text-white text-xs font-medium px-3 md:px-4 py-2 rounded-xl transition-colors"
          >
            Sign Up
          </button>
        </motion.div>
      )}

      {/* Stats - authenticated only */}
      {!isGuest && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={<BookOpen size={18} className="text-accent-blue" />} label="Studied Today" value={String(getTodayStudied())} onClick={() => setInfoModal('studied')} />
          <StatCard icon={<BrainCircuit size={18} className="text-purple-400" />} label="Total Learned" value={String(getTotalStudied())} onClick={() => setInfoModal('learned')} />
          <StatCard icon={<Target size={18} className="text-pass" />} label="Accuracy" value={`${retention}%`} onClick={() => setInfoModal('accuracy')} />
          <StatCard icon={<Flame size={18} className="text-orange-500" />} label="Streak" value={`${getStreak()} Day${getStreak() !== 1 ? 's' : ''}`} onClick={() => setInfoModal('streak')} />
        </section>
      )}

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {/* Decks List */}
        <section className={`${isGuest ? 'md:col-span-3' : 'md:col-span-2'} space-y-4`}>
          <h2 className="font-display text-lg md:text-xl font-semibold text-white">Your Decks</h2>
          {decks.length === 0 ? (
            <div className="glass-panel p-8 md:p-10 rounded-2xl text-center space-y-4">
              <p className="text-gray-400 text-lg">No decks yet</p>
              <button
                type="button"
                onClick={() => setShowCreateDeck(true)}
                className="bg-accent-blue hover:bg-accent-blue/80 text-white text-sm font-medium px-6 py-2 rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Plus size={16} /> Create Your First Deck
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
              {decks.map((deck) => (
                <motion.div
                  key={deck.id}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="glass-panel rounded-2xl hover:border-accent-blue/50 transition-colors group relative overflow-hidden"
                >
                  {/* Animated glow background on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  />
                  {/* Animated top border line */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/60 to-transparent"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                  {/* 3-dot menu */}
                  <div className="absolute top-3 right-3 z-10">
                    <div
                      ref={el => { menuRefs.current[deck.id] = el; }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setMenuOpenId(menuOpenId === deck.id ? null : deck.id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <MoreVertical size={14} />
                    </div>
                  </div>

                  {/* Delete confirmation overlay */}
                  <AnimatePresence>
                    {deleteConfirmId === deck.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-matte-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-center space-y-4">
                          <p className="text-white text-sm">Delete &quot;{deck.title}&quot;?</p>
                          <div className="flex gap-3 justify-center">
                            <button
                              type="button"
                              onClick={() => handleDelete(deck.id)}
                              className="bg-fail text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-fail/80"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="glass-panel text-gray-300 text-xs px-4 py-2 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inline edit */}
                  {editingDeckId === deck.id ? (
                    <div className="p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                        placeholder="Deck title"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-surface border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-accent-blue/50 resize-none"
                        placeholder="Description (optional)"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={saveEdit} className="flex items-center gap-1 bg-accent-blue text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                          <Check size={12} /> Save
                        </button>
                        <button type="button" onClick={() => setEditingDeckId(null)} className="flex items-center gap-1 glass-panel text-gray-400 text-xs px-3 py-1.5 rounded-lg">
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => onSelectDeck(deck.id)} className="p-4 md:p-5 cursor-pointer">
                      <h3 className="font-medium text-base md:text-lg text-white group-hover:text-accent-blue transition-colors pr-8">{deck.title}</h3>
                      {deck.description && (
                        <p className="text-gray-400 text-xs md:text-sm mt-1 line-clamp-2">{deck.description}</p>
                      )}
                      <div className="mt-3 md:mt-4 flex justify-between items-center text-xs text-gray-500">
                        <span>{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</span>
                        <span>{deck.lastStudied ? `Last: ${deck.lastStudied}` : 'Not studied'}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Sidebar */}
        {!isGuest && (
          <section className="space-y-6 md:space-y-8">
            <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-4 cursor-pointer hover:border-accent-blue/30 transition-colors" onClick={() => setInfoModal('retention')}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base md:text-lg font-semibold text-white">Retention</h2>
                <Info size={14} className="text-gray-500" />
              </div>
              <div className="space-y-3">
                <ProgressRow label="Mastered" value={masteredPct} color="bg-pass" />
                <ProgressRow label="Learning" value={learningPct} color="bg-accent-blue" />
                <ProgressRow label="Review" value={reviewPct} color="bg-orange-500" />
              </div>
            </div>
            <Heatmap />
          </section>
        )}
      </div>

      {/* Create Deck Modal */}
      <AnimatePresence>
        {showCreateDeck && (
          <CreateDeck onClose={() => setShowCreateDeck(false)} onCreated={handleDeckCreated} />
        )}
      </AnimatePresence>

      {/* Deck dropdown menu */}
      <AnimatePresence>
        {menuOpenId && decks.find(d => d.id === menuOpenId) && (
          <DeckMenuDropdown
            anchorEl={menuRefs.current[menuOpenId]}
            deck={decks.find(d => d.id === menuOpenId)!}
            onSelect={(action) => handleMenuAction(decks.find(d => d.id === menuOpenId)!, action)}
          />
        )}
      </AnimatePresence>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImportId && importDeck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-matte-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => { setShowImportId(null); setCsvInput(''); setImportError(''); }}
          >
            <div className="glass-panel p-4 md:p-6 rounded-2xl max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base md:text-lg font-semibold text-white">Import CSV</h3>
                <button type="button" onClick={() => { setShowImportId(null); setCsvInput(''); setImportError(''); }} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="text-gray-400 text-xs">Add cards to &quot;{importDeck.title}&quot;. Existing cards won&apos;t be affected.</p>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder={`front,back\n猫 (ねこ),Cat\n안녕,Hello`}
                rows={6}
                className="w-full bg-surface border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 font-mono resize-none"
              />
              {importError && <p className="text-fail text-xs">{importError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => handleImport(showImportId)} className="bg-accent-blue text-white text-xs font-medium px-4 py-2 rounded-lg">Import</button>
                <button type="button" onClick={() => { setShowImportId(null); setCsvInput(''); setImportError(''); }} className="glass-panel text-gray-400 text-xs px-4 py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-matte-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setInfoModal(null)}
          >
            <div className="glass-panel p-6 rounded-2xl max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-blue" />
                  <h3 className="font-display text-lg font-semibold text-white">
                    {infoModal === 'studied' && 'Studied Today'}
                    {infoModal === 'learned' && 'Total Learned'}
                    {infoModal === 'accuracy' && 'Accuracy'}
                    {infoModal === 'streak' && 'Streak'}
                    {infoModal === 'retention' && 'Retention'}
                  </h3>
                </div>
                <button type="button" onClick={() => setInfoModal(null)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {infoModal === 'studied' && (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">Times you have studied or challenged the decks today.</p>
                  <p className="text-2xl font-display font-bold text-accent-blue">{getTodayStudied()} cards</p>
                </div>
              )}

              {infoModal === 'learned' && (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">How many cards you have mastered so far across all decks.</p>
                  <p className="text-2xl font-display font-bold text-purple-400">{labelCounts.mastered} cards</p>
                </div>
              )}

              {infoModal === 'accuracy' && (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">Your passing accuracy in general across all challenge sessions.</p>
                  <p className="text-2xl font-display font-bold text-pass">{retention}%</p>
                </div>
              )}

              {infoModal === 'streak' && (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">The days you have been consistently challenging without breaks.</p>
                  <p className="text-2xl font-display font-bold text-orange-500">{getStreak()} days</p>
                </div>
              )}

              {infoModal === 'retention' && (
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">Your general mastery across all cards. Shows how many cards are in each learning stage.</p>
                  <div className="space-y-3 pt-2">
                    <RetentionDetailRow label="Mastered" count={labelCounts.mastered} pct={masteredPct} color="text-pass" bg="bg-pass/10" />
                    <RetentionDetailRow label="Learning" count={labelCounts.learning} pct={learningPct} color="text-accent-blue" bg="bg-accent-blue/10" />
                    <RetentionDetailRow label="Review" count={labelCounts.review} pct={reviewPct} color="text-orange-400" bg="bg-orange-500/10" />
                    <div className="border-t border-white/10 pt-2 flex justify-between">
                      <span className="text-gray-400 text-sm">Total cards</span>
                      <span className="text-white font-semibold">{totalCards}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RetentionDetailRow({ label, count, pct, color, bg }: { label: string; count: number; pct: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-lg px-3 py-2 flex items-center justify-between`}>
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-semibold">{count}</span>
        <span className="text-gray-500 text-xs">({pct}%)</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: string; onClick?: () => void }) {
  return (
    <motion.div
      className={`glass-panel p-3 md:p-5 rounded-2xl flex flex-col gap-2 md:gap-3 ${onClick ? 'cursor-pointer hover:border-accent-blue/30 transition-colors' : ''}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.03, y: -3 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="p-2 bg-surface-hover rounded-xl w-fit"
        whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <div>
        <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-medium">{label}</p>
        <motion.p
          className="text-xl md:text-2xl font-display font-semibold text-white mt-1"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}

function ProgressRow({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-500">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
