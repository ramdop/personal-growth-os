import React from "react";

interface StoicLayoutProps {
  children: React.ReactNode;
}

export const StoicLayout: React.FC<StoicLayoutProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-black text-white font-stoic flex flex-col items-center justify-center p-6 md:p-12 animate-fade-in relative z-0">
      {/* Subtle Grain or Gradient if needed, but start with pure black per teardown */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent z-[-1]" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1">
        {children}
      </div>
    </div>
  );
};
