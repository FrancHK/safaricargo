import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Package } from 'lucide-react';

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
}

export default function Calendar({ events = [] }: CalendarProps) {
  const today = new Date();
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

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

  function shiftMonth(delta: number) {
    setView(new Date(year, month + delta, 1));
  }

  const selectedCount = counts[dayKey(selected)] ?? 0;

  return (
    <div className="bg-white shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span className="text-sm font-bold">Kalenda</span>
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
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-1">
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
            const count = counts[dayKey(date)] ?? 0;
            return (
              <button
                key={day}
                onClick={() => setSelected(date)}
                title={count > 0 ? `${count} shipment${count > 1 ? 's' : ''}` : undefined}
                className={`relative aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                  isSelected
                    ? 'bg-brand-blue text-white font-bold shadow-md'
                    : isToday
                      ? 'bg-blue-50 text-brand-blue font-bold ring-1 ring-brand-blue/30'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
                {count > 0 && (
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-brand-green'
                    }`}
                  />
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
            onClick={() => { setView(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }}
            className="text-[11px] font-semibold text-brand-blue hover:text-brand-blue-dark uppercase tracking-wider"
          >
            Leo
          </button>
        </div>
      </div>
    </div>
  );
}
