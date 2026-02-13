import React from "react";

interface StoicLayoutProps {
  children: React.ReactNode;
}

export const StoicLayout: React.FC<StoicLayoutProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-[80vh] bg-black text-white font-stoic flex flex-col items-center justify-center p-6 md:p-12 animate-fade-in relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      {/* Subtle Grain or Gradient if needed, but start with pure black per teardown */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        {children}
      </div>
    </div>
  );
};
