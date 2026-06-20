import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Package, Flame } from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
  'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba',
];
const WEEKDAYS = ['Jpili', 'Jtatu', 'Jnne', 'Jtano', 'Alh', 'Ijm', 'Jmosi'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface CalendarProps {
  /** Dates that have shipments — used to mark days. */
  events?: (string | Date)[];
  /** Called when the user picks a day. */
  onSelectDate?: (date: Date) => void;
}

export default function Calendar({ events = [], onSelectDate }: CalendarProps) {
  const today = new Date();
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  function pick(date: Date) {
    setSelected(date);
    onSelectDate?.(date);
  }

  // Count of shipments per day, keyed by Y-M-D
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events) {
      const d = e instanceof Date ? e : new Date(e);
      if (isNaN(d.getTime())) continue;
      const key = dayKey(d);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [events]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Month-level stats for the visible month: total + busiest day.
  const { monthTotal, monthMax, busiestDay } = useMemo(() => {
    let total = 0, max = 0, busiest = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const c = counts[`${year}-${month}-${d}`] ?? 0;
      total += c;
      if (c > max) { max = c; busiest = d; }
    }
    return { monthTotal: total, monthMax: max, busiestDay: busiest };
  }, [counts, year, month, daysInMonth]);

  function shiftMonth(delta: number) {
    setView(new Date(year, month + delta, 1));
  }

  // Green heat tint scaled by how busy a day is relative to the month's peak.
  function heatClass(count: number) {
    if (count <= 0 || monthMax <= 0) return '';
    const ratio = count / monthMax;
    if (ratio > 0.66) return 'bg-brand-green/25 text-green-900';
    if (ratio > 0.33) return 'bg-brand-green/15 text-green-800';
    return 'bg-brand-green/10 text-green-700';
  }

  const selectedCount = counts[dayKey(selected)] ?? 0;

  return (
    <div className="bg-white shadow-md border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span className="text-sm font-bold">Kalenda</span>
          {monthTotal > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/15 rounded-full px-2 py-0.5">
              <Package className="w-3 h-3" /> {monthTotal}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
            title="Mwezi uliopita"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold min-w-[110px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
            title="Mwezi ujao"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-semibold uppercase tracking-wider py-1 ${
                i === 0 || i === 6 ? 'text-red-300' : 'text-gray-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const date = new Date(year, month, day);
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selected);
            const isBusiest = monthMax > 0 && day === busiestDay;
            const count = counts[dayKey(date)] ?? 0;
            return (
              <button
                key={day}
                onClick={() => pick(date)}
                title={count > 0 ? `${count} mzigo${count > 1 ? '/mizigo' : ''}` : undefined}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${
                  isSelected
                    ? 'bg-brand-blue text-white font-bold shadow-md'
                    : isToday
                      ? 'bg-blue-50 text-brand-blue font-bold ring-1 ring-brand-blue/30'
                      : `${heatClass(count)} text-gray-700 hover:bg-gray-100`
                }`}
              >
                {/* Busiest-day flame marker */}
                {isBusiest && !isSelected && (
                  <Flame className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-orange-500" />
                )}
                <span className="text-sm leading-none">{day}</span>
                {count > 0 && (
                  <span
                    className={`mt-0.5 text-[9px] font-bold leading-none ${
                      isSelected ? 'text-white/90' : 'text-brand-green-dark'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer — selected date + shipment count */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 truncate">
          {WEEKDAYS[selected.getDay()]}, {selected.getDate()} {MONTHS[selected.getMonth()]} {selected.getFullYear()}
        </span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {selectedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green">
              <Package className="w-3 h-3" /> {selectedCount}
            </span>
          )}
          <button
            onClick={() => { setView(new Date(today.getFullYear(), today.getMonth(), 1)); pick(today); }}
            className="text-[11px] font-semibold text-brand-blue hover:text-brand-blue-dark uppercase tracking-wider"
          >
            Leo
          </button>
        </div>
      </div>
    </div>
  );
}
