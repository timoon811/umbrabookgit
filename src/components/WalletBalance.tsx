"use client";

import { useState } from 'react';

interface WalletBalanceProps {
  balance: {
    earned: number;
    paid: number;
    pending: number;
    available: number;
  };
  className?: string;
}

export default function WalletBalance({ balance, className = "" }: WalletBalanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zM12 16h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
          <div className="text-sm font-semibold">
            {formatCurrency(balance.available)}
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg 
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white p-4 shadow-lg z-50">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70 text-xs mb-1">
                Всего заработано
              </div>
              <div className="font-semibold">
                {formatCurrency(balance.earned)}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70 text-xs mb-1">
                Выплачено
              </div>
              <div className="font-semibold">
                {formatCurrency(balance.paid)}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70 text-xs mb-1">
                В обработке
              </div>
              <div className="font-semibold">
                {formatCurrency(balance.pending)}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70 text-xs mb-1">
                К выводу
              </div>
              <div className="font-semibold text-yellow-300">
                {formatCurrency(balance.available)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
