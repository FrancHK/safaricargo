import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

interface Props {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Tafuta...', label }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(val: string) {
    onChange(val);
    setQuery('');
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setQuery('');
  }

  return (
    <div ref={ref} className="relative">
      {label && <label className="label">{label}</label>}

      {/* Input */}
      <div
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-text transition-all bg-white ${
          open ? 'ring-2 ring-brand-blue border-transparent' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400 min-w-0"
          placeholder={value ? '' : placeholder}
          value={open ? query : ''}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          readOnly={!open}
        />
        {value && !open && (
          <span className="flex-1 text-sm text-gray-900 truncate">{value}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <button onClick={clear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Selected token */}
      {value && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue text-xs font-medium px-2.5 py-1 rounded-full border border-brand-blue/20">
            <Check className="w-3 h-3" />
            {value}
            <button onClick={clear} className="hover:text-red-500 transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">Hakuna matokeo</div>
          ) : (
            filtered.map(opt => (
              <button
                key={opt}
                onClick={() => select(opt)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                  value === opt ? 'bg-blue-50 text-brand-blue font-medium' : 'text-gray-700'
                }`}
              >
                {opt}
                {value === opt && <Check className="w-4 h-4 text-brand-blue" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
