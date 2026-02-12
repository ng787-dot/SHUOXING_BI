import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
  placeholder: string;
  searchable?: boolean;
  disabledOptions?: string[];
  disabledMessage?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
  label, 
  options, 
  selected, 
  onToggle, 
  placeholder, 
  searchable = false,
  disabledOptions = [],
  disabledMessage = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { 
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-1.5 relative w-full" ref={containerRef}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
      <div 
        className={`w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all shadow-sm ${isOpen ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate ${selected.length ? 'text-blue-700 font-bold' : 'text-slate-400'} select-none`}>
          {selected.length ? `已选 ${selected.length} 项` : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[1000] overflow-hidden py-1 min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-200">
          {searchable && (
            <div className="px-2 py-1.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  autoFocus
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-500 bg-white" 
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          {/* Ensure scrollable and visible */}
          <div className="max-h-80 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const isDisabled = disabledOptions.includes(opt);
                return (
                  <div 
                    key={opt} 
                    className={`px-4 py-2 flex items-center gap-3 text-sm group transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 cursor-pointer'}`} 
                    onClick={() => !isDisabled && onToggle(opt)}
                    title={isDisabled ? disabledMessage : ''}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selected.includes(opt) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 group-hover:border-blue-300'}`}>{selected.includes(opt) && <Check size={10} />}</div>
                    <span className={`truncate ${selected.includes(opt) ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>{opt}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 text-center italic">无匹配项</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;