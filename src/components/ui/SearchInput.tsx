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
    // Outer anchor: w-7 on small screens, expanded on large screens (lg:w-44 xl:w-52)
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { if (!isFocused) setIsHovered(false); }}
      onClick={() => inputRef.current?.focus()}
      className={`relative h-7 shrink-0 cursor-pointer w-7 lg:w-44 xl:w-52 transition-all ${className}`}
    >
      {/* Inner expanding panel — on small screens expands leftward on active, on large screens fills outer anchor statically */}
      <div
        className={`h-7 rounded-[6px] border transition-all duration-200 ease-out overflow-hidden flex items-center ${
          isActive
            ? 'absolute right-0 top-0 w-36 sm:w-44 lg:static lg:w-full bg-white dark:bg-[#151518] border-[#9ca3af] dark:border-[#52525b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(156,163,175,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(82,82,91,0.4)] z-30'
            : 'absolute right-0 top-0 w-7 lg:static lg:w-full bg-gradient-to-b from-white to-[#f4f5f7] dark:from-[#232328] dark:to-[#17171a] border-[#d5d8de] dark:border-[#2c2c33] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.25)] hover:from-white hover:to-[#ebedf1] dark:hover:from-[#2a2a30] dark:hover:to-[#1c1c20] hover:border-[#c8cbd3] dark:hover:border-[#383842]'
        }`}
      >
        {/* Search icon */}
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
          placeholder={placeholder || 'Search...'}
          className={`absolute inset-0 w-full h-full pl-7 pr-7 text-xs font-medium text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] bg-transparent outline-none cursor-text transition-opacity ${
            isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'
          }`}
          {...props}
        />

        {/* Right controls: clear ✕ or ⌘K hint */}
        <div className={`absolute right-1.5 top-0 h-full flex items-center gap-1 ${isActive ? 'flex' : 'hidden lg:flex'}`}>
          {hasValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-[4px] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          ) : cmdk ? (
            <div className="flex items-center gap-0.5 select-none pointer-events-none opacity-60">
              <kbd className="h-4 min-w-[15px] px-0.5 flex items-center justify-center text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#202024] border border-[#d5d8de] dark:border-[#383842] rounded-[3px] text-[9.5px]">
                <Command className="w-2.5 h-2.5" />
              </kbd>
              <kbd className="h-4 min-w-[15px] px-0.5 flex items-center justify-center text-[9.5px] font-mono font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#ebecee] dark:bg-[#202024] border border-[#d5d8de] dark:border-[#383842] rounded-[3px] leading-none">
                K
              </kbd>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
