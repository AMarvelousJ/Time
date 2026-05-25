"use client";

import * as React from "react";
import dayjs from "dayjs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, X } from "lucide-react";

export interface DatePickerProps {
  value?: string; // ISO 格式日期字符串 YYYY-MM-DD
  onChange?: (date: string | null) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
  granularity?: 'day' | 'month';
  /** 与 value 同时传入时，按钮展示为「起始日 ~ 结束日」（用于工作日公示期等） */
  rangeEndDate?: string;
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder,
  className,
  granularity = 'day',
  rangeEndDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // 将 ISO 字符串转换为 Date 对象
  const date = value ? dayjs(value).toDate() : undefined;
  
  // 用于月份选择器的状态
  const [viewDate, setViewDate] = React.useState(date || new Date());
  
  const currentPlaceholder = placeholder || (granularity === 'month' ? "请选择月份" : "请选择日期");
  const displayFormat = granularity === 'month' ? "YYYY-MM" : "YYYY-MM-DD";

  const displayLabel =
    value && rangeEndDate && granularity === 'day'
      ? `${dayjs(value).format('YYYY-MM-DD')} ~ ${rangeEndDate}`
      : value
        ? dayjs(value).format(displayFormat)
        : null;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const format = granularity === 'month' ? "YYYY-MM" : "YYYY-MM-DD";
      onChange?.(dayjs(selectedDate).format(format));
    } else {
      onChange?.(null);
    }
    setOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    const newDate = dayjs(viewDate).month(month).toDate();
    handleSelect(newDate);
  };

  const handleYearChange = (offset: number) => {
    setViewDate(dayjs(viewDate).add(offset, 'year').toDate());
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-between font-normal min-w-[140px]",
            value && rangeEndDate && "min-w-[260px]",
            !value && "text-muted-foreground",
            hasError && "border-red-500 text-red-600",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {displayLabel ?? currentPlaceholder}
            </span>
          </div>
          {value && !disabled && (
            <div 
              role="button"
              tabIndex={0}
              className="ml-2 rounded-full hover:bg-slate-100 p-1 transition-colors z-10"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e);
              }}
            >
              <X className="h-3 w-3 text-slate-500 hover:text-slate-900" />
            </div>
          )}
        </Button>
      } />
      <PopoverContent className="w-auto p-0 shadow-lg border-zinc-200" align="start">
        {granularity === 'month' ? (
          <div className="p-3 w-[280px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => handleYearChange(-1)}
              >
                <span className="text-zinc-400">←</span>
              </Button>
              <div className="font-bold text-zinc-900">
                {dayjs(viewDate).format('YYYY')}年
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => handleYearChange(1)}
              >
                <span className="text-zinc-400">→</span>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const monthDate = dayjs(viewDate).month(i);
                const isSelected = value && dayjs(value).format('YYYY-MM') === monthDate.format('YYYY-MM');
                const isCurrentMonth = dayjs().format('YYYY-MM') === monthDate.format('YYYY-MM');
                
                return (
                  <Button
                    key={i}
                    variant={isSelected ? "default" : "ghost"}
                    className={cn(
                      "h-10 w-full text-sm font-medium transition-all rounded-md",
                      isSelected && "bg-zinc-950 text-white hover:bg-zinc-800",
                      !isSelected && isCurrentMonth && "bg-zinc-100 text-zinc-900",
                      !isSelected && !isCurrentMonth && "text-zinc-600 hover:bg-zinc-50"
                    )}
                    onClick={() => handleMonthSelect(i)}
                  >
                    {i + 1}月
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={handleSelect}
            initialFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
