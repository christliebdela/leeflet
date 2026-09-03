import React, { useRef, useEffect, useState } from 'react';
import { Search, X, Command } from 'lucide-react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  cmdk?: boolean;
  onClear?: () => void;
  onFocusStateChange?: (isFocused: boolean) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  cmdk = false,
  value = '',
  onChange,
  onClear,
  onFocusStateChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocusStateChange) onFocusStateChange(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsHovered(false);
    if (onFocusStateChange) onFocusStateChange(false);
  };

  useEffect(() => {
    if (!cmdk) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        Boolean(activeEl) &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName || '') ||
          activeEl?.isContentEditable ||
          Boolean(activeEl?.closest('[contenteditable="true"]')));

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
  const isActive = isFocused || hasValue || isHovered;

  return (
    // Outer anchor: always w-7 h-7 — never shifts siblings in the flex row
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { if (!isFocused) setIsHovered(false); }}
      onClick={() => inputRef.current?.focus()}
      className={`relative w-7 h-7 shrink-0 cursor-pointer ${className}`}
    >
      {/* Inner expanding panel — grows LEFTWARD via right-0 absolute.
          The card styling (border, bg, rounded) lives here so it always looks like a proper button. */}
      <div
        className={`absolute right-0 top-0 h-7 rounded-[6px] border overflow-hidden transition-all duration-200 ease-out ${
          isActive
            ? 'w-36 sm:w-44 md:w-48 bg-white dark:bg-[#141416] border-[#9ca3af] dark:border-[#52525b] shadow-xs'
            : 'w-7 bg-[#f4f5f6] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] hover:bg-[#ebecee] dark:hover:bg-[#27272a]'
        }`}
      >
        {/* Search icon — always at left-2 inside the panel */}
        <Search
          className={`w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${
            isActive
              ? 'text-[#111827] dark:text-[#f4f4f5]'
              : 'text-[#9ca3af] dark:text-[#71717a]'
          }`}
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isActive ? placeholder : ''}
          className={`absolute inset-0 w-full h-full pl-7 pr-7 text-xs font-medium text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] bg-transparent outline-none cursor-text transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          {...props}
        />

        {/* Right controls: clear ✕ or ⌘K hint */}
        {isActive && (
          <div className="absolute right-1.5 top-0 h-full flex items-center gap-1">
            {hasValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded-[4px] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            ) : cmdk ? (
              <div className="hidden sm:flex items-center gap-0.5 select-none pointer-events-none opacity-70">
                <kbd className="h-4 min-w-[16px] px-0.5 flex items-center justify-center text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[3px] text-[10px]">
                  <Command className="w-2.5 h-2.5" />
                </kbd>
                <kbd className="h-4 min-w-[16px] px-0.5 flex items-center justify-center text-[10px] font-mono font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[3px] leading-none">
                  K
                </kbd>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
