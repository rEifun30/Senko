import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User, ChevronDown, Zap, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  onShowAuth?: () => void;
}

export default function UserProfile({ onShowAuth }: UserProfileProps) {
  const { user, profile, isGuest, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleGuestSignIn = () => {
    setIsOpen(false);
    onShowAuth?.();
  };

  const displayName = isGuest
    ? 'Guest User'
    : profile?.email || user?.email || 'User';

  const displayEmail = isGuest
    ? 'No account sync'
    : profile?.email || user?.email || '';

  return (
    <div className="relative" style={{ zIndex: 30 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-white/5 rounded-full px-3 py-2 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
          {isGuest ? (
            <Zap size={16} className="text-gray-400" />
          ) : (
            <User size={16} className="text-accent-blue" />
          )}
        </div>
        <span className="text-sm text-gray-300 hidden md:block max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-64 glass-panel rounded-xl overflow-hidden shadow-xl"
            style={{ zIndex: 50 }}
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center">
                  {isGuest ? (
                    <Zap size={20} className="text-gray-400" />
                  ) : (
                    <User size={20} className="text-accent-blue" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{displayName}</p>
                  <p className="text-gray-500 text-xs truncate">{displayEmail}</p>
                </div>
              </div>
              {isGuest && (
                <p className="text-xs text-orange-400/80 mt-2">
                  Guest mode: decks are not synced
                </p>
              )}
            </div>

            {isGuest ? (
              <button
                onClick={handleGuestSignIn}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-accent-blue hover:bg-white/5 transition-colors"
              >
                <LogIn size={16} />
                <span>Sign In / Create Account</span>
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
