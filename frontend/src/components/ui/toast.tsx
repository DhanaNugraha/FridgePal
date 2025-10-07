'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  autoDismiss?: boolean;
  duration?: number;
}

export function Toast({ 
  message, 
  type, 
  onDismiss, 
  autoDismiss = true, 
  duration = 5000 
}: ToastProps) {
  console.log('Rendering Toast:', { message, type, autoDismiss });
  useEffect(() => {
    if (!autoDismiss) return;
    
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [autoDismiss, duration, onDismiss]);

  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  };

  return (
    <div 
      className={cn(
        'fixed bottom-4 right-4 z-[9999] p-4 rounded-lg border shadow-xl max-w-md w-full sm:w-96',
        'transition-all duration-300 ease-in-out transform hover:scale-[1.01]',
        typeStyles[type],
        'border-l-4', // Add colored border on the left
        'backdrop-blur-sm bg-opacity-90',
        {
          'border-green-500': type === 'success',
          'border-red-500': type === 'error',
          'border-blue-500': type === 'info',
          'border-amber-500': type === 'warning',
        }
      )}
      role="alert"
      style={{
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          {iconMap[type]}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
