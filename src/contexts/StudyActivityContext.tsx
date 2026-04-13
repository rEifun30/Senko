import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface DayActivity {
  cardsReviewed: number;
  sessions: number;
}

type StudyActivityMap = Record<string, DayActivity>;

interface StudyActivityContextType {
  activity: StudyActivityMap;
  recordStudy: (cardsCount: number) => void;
  getMonthData: (year: number, month: number) => { date: string; activity: DayActivity | null; dayOfWeek: number }[];
  getFirstMonth: () => { year: number; month: number } | null;
  getTotalStudied: () => number;
  getTodayStudied: () => number;
  getStreak: () => number;
}

const StudyActivityContext = createContext<StudyActivityContextType | undefined>(undefined);

const STORAGE_KEY = 'senko_study_activity';

function loadFromStorage(): StudyActivityMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    console.warn('Failed to load study activity');
  }
  return {};
}

function saveToStorage(data: StudyActivityMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save study activity');
  }
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function StudyActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<StudyActivityMap>({});

  useEffect(() => {
    setActivity(loadFromStorage());
  }, []);

  useEffect(() => {
    if (Object.keys(activity).length > 0) {
      saveToStorage(activity);
    }
  }, [activity]);

  const recordStudy = useCallback((cardsCount: number) => {
    const today = getTodayKey();
    setActivity(prev => {
      const existing = prev[today] || { cardsReviewed: 0, sessions: 0 };
      const updated = {
        ...prev,
        [today]: {
          cardsReviewed: existing.cardsReviewed + cardsCount,
          sessions: existing.sessions + 1,
        },
      };
      return updated;
    });
  }, []);

  const getMonthData = useCallback((year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const result: { date: string; activity: DayActivity | null; dayOfWeek: number }[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({ date: '', activity: null, dayOfWeek: i });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      result.push({
        date: dateStr,
        activity: activity[dateStr] || null,
        dayOfWeek: new Date(year, month, day).getDay(),
      });
    }

    return result;
  }, [activity]);

  const getStreak = useCallback(() => {
    const keys = Object.keys(activity);
    if (keys.length === 0) return 0;

    // Sort dates descending
    const sortedDates = keys.sort((a, b) => b.localeCompare(a));
    const today = getTodayKey();

    // Start counting from today or yesterday
    let streak = 0;
    let currentDate = new Date(today);

    // If no activity today, start from yesterday
    if (!activity[today] || activity[today].cardsReviewed === 0) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days backwards
    for (let i = 0; i < sortedDates.length + 1; i++) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      if (activity[dateKey] && activity[dateKey].cardsReviewed > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [activity]);

  const getFirstMonth = useCallback(() => {
    const keys = Object.keys(activity).sort();
    if (keys.length === 0) return null;
    const firstDate = new Date(keys[0]);
    return { year: firstDate.getFullYear(), month: firstDate.getMonth() };
  }, [activity]);

  const getTotalStudied = useCallback(() => {
    return Object.values(activity).reduce((sum, a) => sum + a.cardsReviewed, 0);
  }, [activity]);

  const getTodayStudied = useCallback(() => {
    const today = getTodayKey();
    return activity[today]?.cardsReviewed || 0;
  }, [activity]);

  return (
    <StudyActivityContext.Provider
      value={{
        activity,
        recordStudy,
        getMonthData,
        getFirstMonth,
        getTotalStudied,
        getTodayStudied,
        getStreak,
      }}
    >
      {children}
    </StudyActivityContext.Provider>
  );
}

export function useStudyActivity() {
  const context = useContext(StudyActivityContext);
  if (context === undefined) {
    throw new Error('useStudyActivity must be used within a StudyActivityProvider');
  }
  return context;
}
