import React, { useState, useRef, useEffect } from 'react';
import { Check, Pipette, Sparkles } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

export interface ColorPreset {
  name: string;
  value: string;
}

export const MODERN_COLOR_PRESETS: ColorPreset[] = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0284c7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Lime', value: '#84cc16' },
];

export const EXTENDED_SWATCHES: string[] = [
  '#059669', '#0d9488', '#0891b2', '#0369a1', '#2563eb', '#4f46e5',
  '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48', '#ea580c',
  '#d97706', '#65a30d', '#475569', '#18181b'
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  assignedColors?: Set<string>;
  allowDefault?: boolean;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  assignedColors = new Set(),
  allowDefault = true,
  className = '',
}) => {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  // Close custom popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsCustomOpen(false);
      }
    };
    if (isCustomOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCustomOpen]);

  const isDefaultSelected = !value || value.toLowerCase() === 'default' || value.toLowerCase() === 'none';

  const activePresetMatch = Boolean(value)
    ? MODERN_COLOR_PRESETS.find((p) => p.value.toLowerCase() === value.toLowerCase())
    : undefined;

  const isCustomSelected = Boolean(value && !activePresetMatch && !isDefaultSelected);

  const handleHexChange = (val: string) => {
    let clean = val.startsWith('#') ? val : `#${val}`;
    setHexInput(clean);
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      onChange(clean);
    }
  };

  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex);
          setHexInput(result.sRGBHex);
        }
      } catch {
        // User cancelled eyedropper
      }
    }
  };

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Preset Row */}
      <div className="flex items-center gap-2 flex-wrap p-2.5 rounded-[8px] bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a]">
        {/* Default (Monochrome) Option */}
        {allowDefault && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsCustomOpen(false);
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all relative border border-[#d1d5db] dark:border-[#3f3f46] cursor-pointer ${
                  isDefaultSelected
                    ? 'scale-110 shadow-md bg-[#6b7280] dark:bg-[#71717a]'
                    : 'hover:scale-110 shadow-2xs bg-[#9ca3af] dark:bg-[#52525b] opacity-75 hover:opacity-100'
                }`}
              >
                {isDefaultSelected && (
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[2.5]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Default (Monochrome)
            </TooltipContent>
          </Tooltip>
        )}

        {MODERN_COLOR_PRESETS.map((preset) => {
          const isAssigned = assignedColors.has(preset.value.toLowerCase());
          const isSelected = Boolean(value) && value.toLowerCase() === preset.value.toLowerCase();

          return (
            <Tooltip key={preset.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={isAssigned && !isSelected}
                  onClick={() => {
                    onChange(preset.value);
                    setIsCustomOpen(false);
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all relative ${
                    isSelected
                      ? 'scale-110 shadow-md'
                      : isAssigned
                      ? 'opacity-25 cursor-not-allowed grayscale-[60%]'
                      : 'hover:scale-110 cursor-pointer shadow-2xs'
                  }`}
                  style={{ backgroundColor: preset.value }}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[2.5]" />
                  )}
                  {isAssigned && !isSelected && (
                    <span className="w-full h-[1.5px] bg-white/80 rotate-45 absolute" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {preset.name} {isAssigned && !isSelected ? '(Already in use)' : ''}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Custom Color Trigger Button */}
        <div className="relative" ref={popoverRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsCustomOpen(!isCustomOpen)}
                className={`w-6 h-6 rounded-full flex items-center justify-center border border-[#d1d5db] dark:border-[#3f3f46] transition-all cursor-pointer relative overflow-hidden ${
                  isCustomSelected
                    ? 'scale-110 shadow-md'
                    : 'hover:scale-110 bg-[#ebecee] dark:bg-[#27272a]'
                }`}
                style={{
                  backgroundColor: isCustomSelected ? value : undefined,
                }}
              >
                {isCustomSelected ? (
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[2.5]" />
                ) : (
                  <Pipette className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Custom Color {isCustomSelected ? `(${value})` : ''}
            </TooltipContent>
          </Tooltip>

          {/* Modern Custom Color Popover */}
          {isCustomOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2">
                <span className="font-bold text-[11px] text-[#111827] dark:text-[#f4f4f5] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Custom Color Palette</span>
                </span>
                <div
                  className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shadow-xs"
                  style={{ backgroundColor: value }}
                />
              </div>

              {/* Extended Palette Swatches */}
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-[#6b7280] dark:text-[#a1a1aa]">
                  Extended Shades
                </span>
                <div className="grid grid-cols-8 gap-1.5">
                  {EXTENDED_SWATCHES.map((hex) => {
                    const isAssigned = assignedColors.has(hex.toLowerCase());
                    const isSelected = value.toLowerCase() === hex.toLowerCase();

                    return (
                      <button
                        key={hex}
                        type="button"
                        disabled={isAssigned && !isSelected}
                        onClick={() => {
                          onChange(hex);
                          setHexInput(hex);
                        }}
                        className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-all relative ${
                          isSelected
                            ? 'ring-2 ring-[#111827] dark:ring-white scale-110 shadow-xs'
                            : isAssigned
                            ? 'opacity-25 cursor-not-allowed'
                            : 'hover:scale-110 cursor-pointer shadow-2xs'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white drop-shadow stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hex Code Input & Eyedropper */}
              <div className="space-y-1 pt-1 border-t border-[#f3f4f6] dark:border-[#27272a]">
                <span className="text-[10px] font-medium text-[#6b7280] dark:text-[#a1a1aa]">
                  HEX Code
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => handleHexChange(e.target.value)}
                      placeholder="#10b981"
                      className="w-full px-2.5 py-1 text-xs font-mono rounded-[6px] bg-[#f9fafb] dark:bg-[#141416] border border-[#e5e7eb] dark:border-[#27272a] text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                    />
                  </div>
                  {hasEyeDropper && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleEyeDropper}
                          className="p-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#ebecee] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] border border-[#e5e7eb] dark:border-[#27272a] transition-colors cursor-pointer"
                        >
                          <Pipette className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Sample color from screen</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
