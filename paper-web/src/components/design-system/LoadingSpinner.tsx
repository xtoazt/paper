import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  if (variant === 'spinner') {
    return (
      <div
        className={`spinner ${sizeStyles[size]} border-4 border-[var(--color-gray-200)] border-t-[var(--color-primary-500)] rounded-full animate-spin ${className}`}
      />
    );
  }
  
  if (variant === 'dots') {
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';
    return (
      <div className={`dots-loading flex gap-2 ${className}`}>
        <span className={`${dotSize} bg-[var(--color-primary-500)] rounded-full`} style={{ animation: 'dot-pulse 1.4s ease-in-out infinite' }} />
        <span className={`${dotSize} bg-[var(--color-primary-500)] rounded-full`} style={{ animation: 'dot-pulse 1.4s ease-in-out 0.2s infinite' }} />
        <span className={`${dotSize} bg-[var(--color-primary-500)] rounded-full`} style={{ animation: 'dot-pulse 1.4s ease-in-out 0.4s infinite' }} />
      </div>
    );
  }
  
  if (variant === 'pulse') {
    return (
      <div
        className={`${sizeStyles[size]} bg-[var(--color-primary-500)] rounded-full animate-pulse ${className}`}
      />
    );
  }
  
  return null;
};
