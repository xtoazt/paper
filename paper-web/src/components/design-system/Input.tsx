import React, { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {leftIcon}
          </div>
        )}
        
        <input
          className={`input w-full px-4 py-3 text-base text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg transition-all duration-150 outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-primary)] focus:shadow-[0_0_0_4px_rgba(79,111,238,0.1)] ${leftIcon ? 'pl-12' : ''} ${rightIcon ? 'pr-12' : ''} ${error ? 'border-[var(--color-error)]' : ''} ${className}`}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-[var(--color-error)]">{error}</p>
      )}
      
      {hint && !error && (
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{hint}</p>
      )}
    </div>
  );
};
