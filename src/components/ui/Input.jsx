'use client';

import { forwardRef } from 'react';

const Input = forwardRef(({ 
  className = '', 
  type = 'text', 
  error = false,
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      className={`
        w-full px-3 py-2 rounded-lg border transition-all duration-200
        text-[var(--color-navy)] placeholder:text-[var(--color-muted)]
        bg-white outline-none
        ${error 
          ? 'border-[var(--color-error)] focus:border-[var(--color-error)]' 
          : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
        }
        ${className}
      `}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
