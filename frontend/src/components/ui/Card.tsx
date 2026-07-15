import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'warning' | 'glass';
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const variantStyles = {
  default: 'bg-slate-900 border border-slate-800 shadow-sm',
  highlight: 'bg-slate-900 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.05)]',
  warning: 'bg-slate-900 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.05)]',
  glass: 'bg-slate-950/80 backdrop-blur-md border border-white/5 shadow-lg',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`
          rounded-lg p-6
          ${variantStyles[variant]}
          ${className}
        `}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
