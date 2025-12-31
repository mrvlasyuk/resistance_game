import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 ${className}`}>
      {children}
    </div>
  );
} 