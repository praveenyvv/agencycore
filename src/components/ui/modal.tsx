'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-[420px]', 'max-w-[520px]', 'max-w-[640px]'
  className?: string;
  closeOnBackdrop?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = 'max-w-[520px]',
  className,
  closeOnBackdrop = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/40 backdrop-blur-[3px] overflow-y-auto animate-fade-up"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'relative w-full my-auto bg-white rounded-[14px] shadow-[0_10px_35px_rgba(0,0,0,0.15)] border border-[#e5e7eb] flex flex-col overflow-hidden max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)]',
          maxWidth,
          className
        )}
      >
        {/* Sticky Header */}
        {title && (
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#e5e7eb] bg-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && <div className="shrink-0">{icon}</div>}
              <h3 className="font-bold text-[15px] sm:text-[16px] text-[#111827] truncate">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3 sm:py-3.5 border-t border-[#e5e7eb] bg-[#fafafa] flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
