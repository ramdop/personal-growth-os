import React from "react";
import { Background } from "./Background";
import { View, AppState } from "../types";
import {
  Home,
  PenTool,
  Target,
  Calendar,
  BarChart2,
  Settings as SettingsIcon,
  Activity,
  Sun,
  Moon,
  LogOut,
  Book,
} from "lucide-react";
import { AICompanion } from "./AICompanion";

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  setView,
  theme,
  toggleTheme,
  state,
  updateState,
  onLogout,
}) => {
  const navItems: { id: View; icon: any; label: string }[] = [
    { id: "dashboard", icon: Home, label: "Aligned" },
    { id: "checkin", icon: PenTool, label: "Daily" },
    { id: "habits", icon: Activity, label: "Habits" },
    { id: "okrs", icon: Target, label: "OKRs" },
    { id: "review", icon: Calendar, label: "Review" },
    { id: "insights", icon: BarChart2, label: "Insights" },
    { id: "journal", icon: Book, label: "Journal" },
    { id: "settings", icon: SettingsIcon, label: "System" },
  ];

  return (
    <div className="min-h-screen font-sans pb-24 md:pb-0 transition-colors duration-500 text-primary">
      <Background theme={theme} />

      {/* Desktop Sidebar / Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:bottom-0 md:w-24 md:border-r border-t md:border-t-0 border-primary/10 glass-panel z-50 flex md:flex-col justify-around md:justify-between p-4 md:p-6 transition-all">
        {/* Theme Toggle (Temporarily Disabled for Stability) */}
        {/*
        <div className="hidden md:flex flex-col items-center absolute top-8 left-0 right-0">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-primary/10 text-primary/60 transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        */}

        <div className="contents md:flex md:flex-col md:items-center md:gap-8 md:justify-center md:flex-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 group ${
                  isActive
                    ? "text-primary scale-110"
                    : "text-primary/40 hover:text-primary/70"
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary/10 shadow-lg"
                      : "group-hover:bg-primary/5"
                  }`}
                >
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium tracking-wider md:hidden">
                  {item.label}
                </span>
                <span className="hidden md:block text-[10px] font-medium tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute left-20 bg-glass-surface border border-primary/10 px-2 py-1 rounded backdrop-blur-md whitespace-nowrap text-primary z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex md:flex-col md:items-center md:pb-4">
          <div className="w-8 h-px bg-primary/10 mb-6" />
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 transition-all duration-300 group text-red-400/60 hover:text-red-500"
            title="Sign Out"
          >
            <div className="p-2 rounded-xl group-hover:bg-red-500/10 transition-all">
              <LogOut size={24} strokeWidth={1.5} />
            </div>
          </button>
        </div>

        {/* Mobile Theme Toggle */}
        {/*
        <button onClick={toggleTheme} className="md:hidden fixed top-6 right-6 p-2 rounded-full bg-glass-surface backdrop-blur-md border border-primary/10 text-primary/80 z-50">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        */}
      </nav>

      {/* Main Content Area */}
      <main
        className={`md:ml-24 min-h-screen flex flex-col ${
          currentView === "journal"
            ? "p-0 max-w-none"
            : "p-6 md:p-12 max-w-5xl mx-auto"
        }`}
      >
        {currentView !== "journal" && (
          <header className="mb-8 md:mb-12 flex justify-between items-center">
            <div className="glass-panel px-8 py-4 rounded-full">
              <h2 className="text-xl md:text-2xl font-serif text-primary tracking-wide">
                {currentView === "dashboard" && "Alignment Check"}
                {currentView === "checkin" && "Daily Protocol"}
                {currentView === "habits" && "Identity Stack"}
                {currentView === "okrs" && "Objectives"}
                {currentView === "review" && "Weekly Synthesis"}
                {currentView === "insights" && "Earned Insights"}
                {currentView === "settings" && "System Control"}
              </h2>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent flex-1 ml-8 hidden md:block" />
          </header>
        )}

        <div
          className={`flex-1 animate-fade-in ${
            currentView === "journal" ? "h-full" : ""
          }`}
        >
          {children}
        </div>
      </main>

      {/* AI Companion Layer */}
      <AICompanion state={state} updateState={updateState} />
    </div>
  );
};
