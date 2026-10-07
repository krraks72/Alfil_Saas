// components/simple-multi-select.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function SimpleMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter(item => item !== value));
    }
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Trigger */}
      <div
        className="flex flex-wrap gap-1 p-2 pr-8 border rounded-md min-h-[40px] cursor-pointer bg-background relative"
        onClick={() => setIsOpen(prev => !prev)}
      >
        {selected.length === 0 ? (
          <span className="text-sm text-muted-foreground self-center">{placeholder}</span>
        ) : (
          selected.map(value => {
            const option = options.find(o => o.value === value);
            return (
              <Badge key={value} variant="secondary" className="rounded-sm px-1 font-normal">
                {option?.label || value}
                <button
                  type="button"
                  className="ml-1 rounded-sm"
                  onClick={(e) => handleRemove(value, e)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })
        )}
        <ChevronDown className="h-4 w-4 opacity-50 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[60000] w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
          {/* Search box */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setIsOpen(false); }
                e.stopPropagation();
              }}
            />
          </div>

          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No results found.</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={`px-3 py-2 text-sm rounded-sm cursor-pointer flex items-center justify-between hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent/50' : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected && <X className="h-3 w-3 opacity-50" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
