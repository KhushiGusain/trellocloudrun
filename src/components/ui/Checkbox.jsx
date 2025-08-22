'use client';

import { forwardRef } from 'react';

const Checkbox = forwardRef(({ 
  id,
  className = '', 
  children,
  ...props 
}, ref) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        type="checkbox"
        id={id}
        className="
          w-4 h-4 rounded border border-[var(--color-muted)]
          text-[var(--color-primary)] focus:ring-[var(--color-primary)]
          focus:ring-2 focus:ring-offset-0
          bg-white cursor-pointer
        "
        ref={ref}
        {...props}
      />
      {children && (
        <label 
          htmlFor={id} 
          className="text-sm text-[var(--color-muted)] cursor-pointer select-none"
        >
          {children}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
