import React, { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'glass' | 'outlined';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  hoverable = false,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-300';
  
  const variantStyles = {
    elevated: 'card bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-[var(--shadow-sm)]',
    glass: 'card-glass bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]',
    outlined: 'bg-transparent border-2 border-[var(--border-primary)]'
  };
  
  const hoverStyles = hoverable ? 'hover-lift cursor-pointer' : '';
  
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
