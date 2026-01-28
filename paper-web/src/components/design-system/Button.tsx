import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'btn button-press inline-flex items-center justify-center gap-2 font-medium border-none cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'btn-primary bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-lg)]',
    secondary: 'btn-secondary bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]',
    ghost: 'btn-ghost bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
    danger: 'bg-[var(--color-error)] text-white shadow-[var(--shadow-error)] hover:shadow-[var(--shadow-lg)]'
  };
  
  const sizeStyles = {
    sm: 'text-sm px-3 py-2 rounded-lg',
    md: 'text-base px-6 py-3 rounded-xl',
    lg: 'text-lg px-8 py-4 rounded-2xl'
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};
