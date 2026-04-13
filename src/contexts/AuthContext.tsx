import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { UserProfile, UserStats } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  stats: UserStats | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  refreshStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  email: 'guest@senko.app',
  created_at: new Date().toISOString(),
  isGuest: true,
};

const GUEST_STATS: UserStats = {
  studiedToday: 0,
  totalLearned: 0,
  accuracy: 0,
  currentStreak: 0,
  masteredCount: 0,
  learningCount: 0,
  reviewCount: 0,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: user?.email }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            return null;
          }
          return newProfile as UserProfile;
        }
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as UserProfile;
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      return null;
    }
  }, [user?.email]);

  const fetchUserStats = useCallback(async (userId: string): Promise<UserStats> => {
    try {
      // Fetch today's studied count
      const today = new Date().toISOString().split('T')[0];
      const { count: studiedToday } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('reviewed_at', `${today}T00:00:00`);

      // Fetch total learned
      const { count: totalLearned } = await supabase
        .from('card_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'mastered');

      // Fetch streak
      const { data: streakData } = await supabase
        .from('study_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      return {
        studiedToday: studiedToday || 0,
        totalLearned: totalLearned || 0,
        accuracy: 85, // TODO: Calculate from pass/fail ratio
        currentStreak: streakData?.current_streak || 0,
        masteredCount: totalLearned || 0,
        learningCount: 0,
        reviewCount: 0,
      };
    } catch (err) {
      console.error('Error fetching stats:', err);
      return {
        studiedToday: 0,
        totalLearned: 0,
        accuracy: 0,
        currentStreak: 0,
        masteredCount: 0,
        learningCount: 0,
        reviewCount: 0,
      };
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsGuest(false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile and stats when user changes
  useEffect(() => {
    if (user?.id && !isGuest) {
      fetchUserProfile(user.id).then((profile) => {
        setProfile(profile);
      });
    }
  }, [user, isGuest, fetchUserProfile]);

  // Fetch stats when user changes
  useEffect(() => {
    if (user?.id && !isGuest) {
      fetchUserStats(user.id).then((userStats) => {
        setStats(userStats);
      });
    } else if (isGuest) {
      setStats(GUEST_STATS);
    }
  }, [user, isGuest, fetchUserStats]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setStats(null);
    setIsGuest(false);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setProfile(GUEST_PROFILE);
    setStats(GUEST_STATS);
  };

  const refreshStats = async () => {
    if (user?.id && !isGuest) {
      const userStats = await fetchUserStats(user.id);
      setStats(userStats);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        stats,
        loading,
        isGuest,
        signIn,
        signUp,
        signOut,
        continueAsGuest,
        refreshStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
