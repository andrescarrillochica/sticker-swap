import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { getAllSections } from '../lib/stickers';

interface Props {
  selected: string;
  onChange: (code: string) => void;
  spareSections?: Set<string>;
}

export function SectionPicker({ selected, onChange, spareSections }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sections = useMemo(() => getAllSections(), []);

  const selectedSection = sections.find((s) => s.code === selected);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q)
    );
  }, [query, sections]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setQuery('');
  }

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-left active:bg-gray-50"
      >
        <span className={selectedSection ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {selectedSection
            ? `${selectedSection.name} (${selectedSection.code}) — Group ${selectedSection.group}`
            : 'Select section...'}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name, code, or group..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Results list */}
          <ul className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-400 text-center">No sections found</li>
            ) : (
              filtered.map((s) => (
                <li key={s.code}>
                  <button
                    onClick={() => handleSelect(s.code)}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between active:bg-gray-50 ${
                      s.code === selected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {spareSections?.has(s.code) && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 shrink-0">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                      {s.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">
                      {s.code} · Grp {s.group}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
