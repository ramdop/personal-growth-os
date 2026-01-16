
import React, { useState } from 'react';
import { AppState } from '../types';
import { exportData } from '../services/storage';
import { AuthService } from '../services/auth';
import { DEFAULT_SYSTEM_PROMPT } from '../constants';
import { GlassCard } from '../components/GlassCard';
import { Download, Database, LogOut, Sun, Moon, Sparkles, RefreshCw, Save, User as UserIcon } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const Settings: React.FC<Props> = ({ state, updateState }) => {
  const [promptEdit, setPromptEdit] = useState(state.systemPrompt || DEFAULT_SYSTEM_PROMPT);

  const handleClearData = () => {
    if (confirm("CRITICAL WARNING: This will delete ALL local data for this account. This cannot be undone. Are you sure?")) {
      // In a real app, this would delete from DB. Here we just clear the specific key.
      if (state.user) {
         localStorage.removeItem(`pgos_data_${state.user.id}`);
         window.location.reload();
      }
    }
  };

  const handleLogout = async () => {
    if (confirm("Sync complete. Ready to disconnect?")) {
       await AuthService.logout();
       window.location.reload(); // Force reload to clear React state and show Auth screen
    }
  };

  const toggleTheme = () => {
    updateState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const savePrompt = () => {
    updateState(prev => ({ ...prev, systemPrompt: promptEdit }));
    alert("Companion Persona Updated. It will take effect on the next chat session.");
  };

  const resetPrompt = () => {
    if (confirm("Reset companion personality to default?")) {
      setPromptEdit(DEFAULT_SYSTEM_PROMPT);
      updateState(prev => ({ ...prev, systemPrompt: DEFAULT_SYSTEM_PROMPT }));
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <GlassCard title="Identity & Session">
         <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <UserIcon size={20} />
              </div>
              <div>
                <div className="font-medium text-primary">{state.user?.name || 'Seeker'}</div>
                <div className="text-xs text-muted">{state.user?.email}</div>
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
               Sync Active
            </div>
         </div>
         
         <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-lg transition-colors text-primary text-sm font-medium"
          >
            <LogOut size={16} /> Disconnect Session
          </button>
      </GlassCard>

      <GlassCard title="Appearance">
        <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors text-primary"
          >
            <div className="flex items-center gap-3">
              {state.theme === 'light' ? <Moon size={20} className="text-indigo-600 dark:text-indigo-400" /> : <Sun size={20} className="text-orange-300" />}
              <div className="text-left">
                <div className="font-medium">Switch to {state.theme === 'light' ? 'Dark' : 'Light'} Mode</div>
                <div className="text-xs text-muted">Current: {state.theme === 'light' ? 'Light' : 'Dark'}</div>
              </div>
            </div>
        </button>
      </GlassCard>

      <GlassCard title="AI Companion Persona">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles className="text-emerald-500 mt-1 shrink-0" size={20} />
            <div className="text-sm text-muted">
              Modify the system instructions to change how the AI reflects with you. Keep the core tools intact for functionality.
            </div>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full h-48 bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm font-mono leading-relaxed text-primary focus:outline-none focus:border-primary/30 resize-none transition-all"
              value={promptEdit}
              onChange={(e) => setPromptEdit(e.target.value)}
              placeholder="Enter system instructions..."
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={savePrompt}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2 rounded-lg transition-all font-medium text-sm"
            >
              <Save size={16} /> Update Persona
            </button>
            <button 
              onClick={resetPrompt}
              className="flex items-center justify-center gap-2 px-4 bg-primary/5 hover:bg-primary/10 border border-primary/10 text-muted py-2 rounded-lg transition-all text-sm"
              title="Reset to Default"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="Data Sovereignty">
        <div className="space-y-4">
          <button 
            onClick={() => exportData(state)}
            className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors text-primary"
          >
            <div className="flex items-center gap-3">
              <Download size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div className="text-left">
                <div className="font-medium">Export Full Backup</div>
                <div className="text-xs text-muted">JSON format. Includes all logs and settings.</div>
              </div>
            </div>
          </button>
        </div>
      </GlassCard>

      <GlassCard title="Danger Zone">
        <div className="space-y-4">
          <button 
            onClick={handleClearData}
            className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Database size={20} className="text-red-600 dark:text-red-400 group-hover:text-red-500 dark:group-hover:text-red-300" />
              <div className="text-left">
                <div className="font-medium text-red-600 dark:text-red-400">Wipe Local Data</div>
                <div className="text-xs text-red-600/50 dark:text-red-400/50">Delete all data on this device.</div>
              </div>
            </div>
          </button>
        </div>
      </GlassCard>
      
      <div className="text-center text-xs text-muted font-serif pt-8">
        Personal Growth OS v1.3 <br/>
        Cloud Sync Active
      </div>
    </div>
  );
};
