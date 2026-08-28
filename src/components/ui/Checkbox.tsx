import React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  disabled = false,
  children,
  className = '',
  id,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !onChange) return;
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || !onChange) return;
      onChange(!checked);
    }
  };

  return (
    <label
      id={id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      className={`inline-flex items-center gap-2 cursor-pointer select-none outline-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        className={`w-4 h-4 rounded-[4px] flex items-center justify-center border transition-all duration-150 shrink-0 ${
          checked
            ? 'bg-[#111827] dark:bg-[#f4f4f5] border-[#111827] dark:border-[#f4f4f5] text-white dark:text-[#111827]'
            : 'bg-transparent border-[#d1d5db] dark:border-[#3f3f46] group-hover:border-[#9ca3af] dark:group-hover:border-[#52525b]'
        } group-focus-visible:ring-2 group-focus-visible:ring-[#111827] dark:group-focus-visible:ring-white group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-white dark:group-focus-visible:ring-offset-[#18181b]`}
      >
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-2.5 h-2.5 transition-transform duration-150 ${
            checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          <path d="M2.5 7.5L5.5 10.5L11.5 3.5" />
        </svg>
      </div>

      {children && (
        <span className="text-xs text-[#374151] dark:text-[#d4d4d8] leading-none">
          {children}
        </span>
      )}
    </label>
  );
};
