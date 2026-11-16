'use client';

import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ModernDateTimePickerProps {
  value: string; // ISO string or YYYY-MM-DDTHH:mm or empty
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

export function ModernDateTimePicker({
  value,
  onChange,
  label,
  required,
}: ModernDateTimePickerProps) {
  // Derive date and time components immutably from value prop
  const datePart = value?.includes('T')
    ? value.split('T')[0]
    : value
    ? value.slice(0, 10)
    : '';

  const timePart = value?.includes('T')
    ? value.split('T')[1]?.slice(0, 5) || '10:00'
    : '10:00';

  const handleDateChange = (newDate: string) => {
    if (newDate) {
      onChange(`${newDate}T${timePart || '10:00'}`);
    } else {
      onChange('');
    }
  };

  const handleTimeChange = (newTime: string) => {
    const currentOrToday = datePart || new Date().toISOString().split('T')[0];
    onChange(`${currentOrToday}T${newTime}`);
  };

  // Preset quick times
  const timePresets = ['09:30', '11:00', '14:30', '16:00', '18:00'];

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-medium text-zinc-700 flex items-center justify-between">
          <span>{label} {required && '*'}</span>
          {datePart && (
            <span className="text-[10px] text-zinc-400 font-mono">
              Selected: {datePart} at {timePart}
            </span>
          )}
        </label>
      )}

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        {/* Date Selector */}
        <div className="relative flex-1 min-w-[140px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-400">
            <CalendarIcon className="h-3.5 w-3.5" />
          </div>
          <Input
            type="date"
            required={required}
            value={datePart}
            onChange={(e) => handleDateChange(e.target.value)}
            className="pl-8 h-9 text-xs font-medium bg-white"
          />
        </div>

        {/* Time Selector */}
        <div className="relative w-32 shrink-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <Input
            type="time"
            value={timePart}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="pl-8 h-9 text-xs font-mono bg-white"
          />
        </div>

        {/* Quick Time Presets */}
        <div className="hidden lg:flex items-center gap-1">
          {timePresets.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTimeChange(t)}
              className={`rounded px-1.5 py-1 text-[10px] font-mono transition-colors cursor-pointer border ${
                timePart === t
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
