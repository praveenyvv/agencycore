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

/**
 * Returns the current local date and time formatted as YYYY-MM-DDTHH:mm
 */
export function getCurrentLocalDateTimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ModernDateTimePicker({
  value,
  onChange,
  label,
  required,
}: ModernDateTimePickerProps) {
  // Derive date and time components cleanly
  const effectiveValue = value || '';

  const datePart = effectiveValue.includes('T')
    ? effectiveValue.split('T')[0]
    : effectiveValue
    ? effectiveValue.slice(0, 10)
    : '';

  const timePart = effectiveValue.includes('T')
    ? effectiveValue.split('T')[1]?.slice(0, 5) || ''
    : '';

  const handleDateChange = (newDate: string) => {
    if (newDate) {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      onChange(`${newDate}T${timePart || `${currentHours}:${currentMinutes}`}`);
    } else {
      onChange('');
    }
  };

  const handleTimeChange = (newTime: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentOrToday = datePart || `${year}-${month}-${day}`;
    onChange(`${currentOrToday}T${newTime}`);
  };

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="block text-xs font-medium text-zinc-700 truncate">
          {label} {required && '*'}
        </label>
      )}

      <div className="flex items-center gap-2 w-full">
        {/* Date Selector */}
        <div className="relative flex-1 min-w-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-400">
            <CalendarIcon className="h-3.5 w-3.5" />
          </div>
          <Input
            type="date"
            required={required}
            value={datePart}
            onChange={(e) => handleDateChange(e.target.value)}
            className="pl-8 pr-2 h-9 text-xs font-medium bg-white w-full"
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
            className="pl-8 pr-2 h-9 text-xs font-mono bg-white w-full"
          />
        </div>
      </div>
    </div>
  );
}
