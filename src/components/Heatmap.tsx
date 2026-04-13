import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudyActivity } from '../contexts/StudyActivityContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// GitHub-style 5-tier intensity scale
function getIntensity(cardsReviewed: number): number {
  if (cardsReviewed === 0) return 0;
  if (cardsReviewed <= 10) return 1;
  if (cardsReviewed <= 30) return 2;
  if (cardsReviewed <= 60) return 3;
  if (cardsReviewed <= 100) return 4;
  return 5;
}

// Senko blue heatmap colors (Senko theme)
function getCellColor(intensity: number): string {
  const colors: Record<number, string> = {
    0: 'bg-[#161b22]',
    1: 'bg-[#0c2d6b]',
    2: 'bg-[#1a4b8c]',
    3: 'bg-[#2563eb]',
    4: 'bg-[#3b82f6]',
    5: 'bg-[#60a5fa]',
  };
  return colors[intensity] || colors[0];
}

interface TooltipData {
  date: string;
  cardsReviewed: number;
  sessions: number;
}

export default function Heatmap() {
  const { getMonthData, getFirstMonth } = useStudyActivity();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const isFirstMonth = (() => {
    const first = getFirstMonth();
    if (!first) return false;
    return viewYear === first.year && viewMonth === first.month;
  })();

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const monthData = getMonthData(viewYear, viewMonth);

  const goPrev = () => {
    if (isFirstMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goNext = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-3 md:space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base md:text-lg font-semibold text-white">Activity</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirstMonth}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs md:text-sm text-gray-300 font-medium min-w-[100px] md:min-w-[120px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={isCurrentMonth}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-[3px]">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            {d.charAt(0)}
          </div>
        ))}
      </div>

      {/* Heatmap grid - GitHub style */}
      <div className="grid grid-cols-7 gap-[3px] relative">
        {monthData.map((day, i) => {
          if (!day.activity) {
            return <div key={`empty-${i}`} className="w-3 h-3 md:w-[12px] md:h-[12px] rounded-[2px] bg-[#161b22]" />;
          }

          const intensity = getIntensity(day.activity.cardsReviewed);
          const isToday = day.date === todayKey;

          return (
            <div
              key={day.date}
              className="w-3 h-3 md:w-[12px] md:h-[12px] rounded-[2px] relative"
              onMouseEnter={() => setTooltip({ date: day.date, cardsReviewed: day.activity!.cardsReviewed, sessions: day.activity!.sessions })}
              onMouseLeave={() => setTooltip(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.min(i * 0.005, 0.5), duration: 0.15 }}
                className={`w-full h-full rounded-[2px] ${getCellColor(intensity)} transition-colors duration-150 ${isToday ? 'ring-1 ring-white/50' : ''}`}
              />
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-gray-900 rounded-md shadow-lg z-50 pointer-events-none whitespace-nowrap hidden md:block">
            <p className="text-[11px] font-medium">{formatDate(tooltip.date)}</p>
            <p className="text-[10px] text-gray-500">{tooltip.cardsReviewed} cards · {tooltip.sessions} session{tooltip.sessions !== 1 ? 's' : ''}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-2 h-2 bg-white rotate-45" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
