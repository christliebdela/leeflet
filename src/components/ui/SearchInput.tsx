import React, { useRef, useEffect, useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
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
  const isActive = isFocused || hasValue;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`relative flex items-center transition-all duration-200 ease-out cursor-pointer ${
        isActive ? 'w-40 sm:w-52 shadow-xs' : 'w-7 sm:w-24'
      } ${className}`}
    >
      <Search
        className={`w-3.5 h-3.5 absolute left-2 pointer-events-none transition-colors ${
          isActive
            ? 'text-[#111827] dark:text-[#f4f4f5]'
            : 'text-[#9ca3af] dark:text-[#71717a]'
        }`}
      />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isActive ? placeholder : ''}
        className={`w-full py-1 text-xs font-medium text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] outline-none transition-all cursor-text ${
          isActive
            ? 'pl-7 pr-7 bg-white dark:bg-[#141416]'
            : 'pl-7 pr-2 bg-[#f4f5f6] dark:bg-[#1c1c1f] hover:bg-[#ebecee] dark:hover:bg-[#27272a]'
        }`}
        {...props}
      />

      {/* When not active and on sm+ screens, show compact Search label */}
      {!isActive && (
        <span className="absolute left-7 text-[11px] text-[#9ca3af] dark:text-[#71717a] pointer-events-none select-none hidden sm:inline truncate pr-2">
          {placeholder}
        </span>
      )}

      <div className="absolute right-1.5 flex items-center gap-1">
        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-[4px] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        ) : cmdk && isActive ? (
          <div className="hidden sm:flex items-center gap-0.5 select-none pointer-events-none opacity-80">
            <kbd className="h-4 min-w-[16px] px-0.5 flex items-center justify-center text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[3px] shadow-xs text-[10px]">
              <Command className="w-2.5 h-2.5" />
            </kbd>
            <kbd className="h-4 min-w-[16px] px-0.5 flex items-center justify-center text-[10px] font-mono font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[3px] shadow-xs leading-none">
              K
            </kbd>
          </div>
        ) : null}
      </div>
    </div>
  );
};
