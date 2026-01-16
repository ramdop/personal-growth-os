
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  action?: React.ReactNode;
  hoverEffect?: boolean; // New prop to force hover visuals
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, subtitle, onClick, action, hoverEffect = false }) => {
  // We enable the visual effect if explicitly requested OR if it's clickable
  const shouldHover = hoverEffect || !!onClick;

  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 transition-all duration-500 ${shouldHover
        ? 'hover:scale-[1.02] hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_30px_rgba(var(--text-base),0.15)]'
        : ''
        } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && <h3 className="text-xl font-medium text-primary font-serif tracking-wide">{title}</h3>}
            {subtitle && <p className="text-sm text-muted mt-1 font-sans">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-primary font-sans font-light">
        {children}
      </div>
    </div>
  );
};
