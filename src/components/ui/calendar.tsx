import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

export interface CalendarProps {
  mode?: 'single';
  selected?: Date | null;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  initialMonth?: Date;
  disabled?: (date: Date) => boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  mode: _mode = 'single',
  selected,
  onSelect,
  className = '',
  initialMonth,
  disabled,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selected || initialMonth || new Date()
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (day: Date) => {
    if (disabled && disabled(day)) return;
    if (selected && isSameDay(day, selected)) {
      onSelect?.(undefined);
    } else {
      onSelect?.(day);
    }
  };

  return (
    <div className={`p-2.5 bg-white dark:bg-[#18181b] select-none text-xs font-sans ${className}`}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#f3f4f6] dark:border-[#27272a]">
        <span className="font-semibold text-xs text-[#111827] dark:text-[#f4f4f5]">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-[5px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-[5px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDays.map((wd) => (
          <span
            key={wd}
            className="text-[10px] font-medium text-[#9ca3af] dark:text-[#71717a] py-0.5"
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelectedDay = selected ? isSameDay(day, selected) : false;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const isDisabled = disabled ? disabled(day) : false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(day)}
              className={`w-7 h-7 flex items-center justify-center rounded-[6px] text-xs font-medium transition-all relative ${
                isSelectedDay
                  ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] font-bold shadow-xs'
                  : isCurrentDay
                  ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-emerald-600 dark:text-emerald-400 font-bold hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46]'
                  : !isCurrentMonth
                  ? 'text-[#9ca3af]/50 dark:text-[#71717a]/50 hover:bg-[#f9fafb] dark:hover:bg-[#202024]'
                  : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
              } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span>{format(day, 'd')}</span>
              {isCurrentDay && !isSelectedDay && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
