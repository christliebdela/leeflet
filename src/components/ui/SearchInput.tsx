import React, { useRef, useEffect } from 'react';
import { Search, X, Command } from 'lucide-react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  cmdk?: boolean;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  cmdk = false,
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cmdk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        Boolean(activeEl) &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName || '') ||
          activeEl?.isContentEditable ||
          Boolean(activeEl?.closest('[contenteditable="true"]')));

      // Ctrl+K or Cmd+K or '/' to focus search
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) ||
        (e.key === '/' && !isInput)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cmdk]);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
    inputRef.current?.focus();
  };

  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-[#9ca3af] dark:text-[#71717a] absolute left-2.5 pointer-events-none transition-colors" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-16 py-1 bg-[#f4f5f6] dark:bg-[#1c1c1f] text-xs font-medium text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] outline-none focus:outline-none focus:ring-0"
        {...props}
      />

      <div className="absolute right-2 flex items-center gap-1">
        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-[4px] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : cmdk ? (
          <div className="hidden sm:flex items-center gap-1 select-none pointer-events-none">
            <kbd className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[4px] shadow-xs">
              <Command className="w-3.5 h-3.5" />
            </kbd>
            <kbd className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[11px] font-mono font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[4px] shadow-xs leading-none">
              K
            </kbd>
          </div>
        ) : null}
      </div>
    </div>
  );
};
