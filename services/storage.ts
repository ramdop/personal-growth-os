
import { AppState, DailyLog, Habit, Objective, WeeklyReview } from '../types';
import { DEFAULT_SYSTEM_PROMPT } from '../constants';

/* 
   ==========================================================================
   PRODUCTION IMPLEMENTATION (SUPABASE JSON BLOB)
   Uncomment this section to sync data across devices via Supabase.
   ==========================================================================

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export const loadState = async (userId: string | null): Promise<AppState> => {
   if (!userId) return { user: null, ...DEFAULT_STATE_DATA };
   
   const { data, error } = await supabase
     .from('user_data')
     .select('data')
     .eq('user_id', userId)
     .single();

   if (error || !data) return { user: { id: userId }, ...DEFAULT_STATE_DATA };
   return { user: { id: userId }, ...DEFAULT_STATE_DATA, ...data.data };
};

export const saveState = async (state: AppState) => {
   if (!state.user) return;
   
   const dataToSave = {
      theme: state.theme,
      logs: state.logs,
      habits: state.habits,
      objectives: state.objectives,
      reviews: state.reviews,
      unlockedVisualizations: state.unlockedVisualizations,
      systemPrompt: state.systemPrompt
   };

   await supabase
     .from('user_data')
     .upsert({ user_id: state.user.id, data: dataToSave });
};
*/

// ==========================================================================
// CURRENT: MOCK IMPLEMENTATION (LOCAL STORAGE)
// Data is persisted only to this browser instance.
// ==========================================================================

// Data is now namespaced by User ID
const getStorageKey = (userId: string) => `pgos_data_${userId}`;

const DEFAULT_STATE_DATA = {
  theme: 'dark' as const,
  logs: [],
  habits: [],
  objectives: [],
  reviews: [],
  unlockedVisualizations: [],
  systemPrompt: DEFAULT_SYSTEM_PROMPT
};

export const loadState = (userId: string | null): AppState => {
  // If no user, return default state with null user
  if (!userId) {
    return {
      user: null,
      ...DEFAULT_STATE_DATA
    };
  }

  try {
    const key = getStorageKey(userId);
    const serialized = localStorage.getItem(key);
    
    if (!serialized) {
      console.log(`PGOS: No saved state found for user ${userId}. Using defaults.`);
      return { user: { id: userId, email: '', name: '' }, ...DEFAULT_STATE_DATA }; // User object will be hydrated by Auth component usually
    }

    const loaded = JSON.parse(serialized);
    
    return { 
      user: { id: userId, email: '', name: '' }, // Placeholder, real user obj comes from session
      ...DEFAULT_STATE_DATA,
      ...loaded,
    };
  } catch (e) {
    console.error("PGOS: Failed to load state", e);
    return { user: null, ...DEFAULT_STATE_DATA };
  }
};

export const saveState = (state: AppState) => {
  if (!state.user) return; // Don't save if no user logged in
  
  try {
    const key = getStorageKey(state.user.id);
    // We don't save the 'user' object itself in the data blob, just the app data
    const dataToSave = {
      theme: state.theme,
      logs: state.logs,
      habits: state.habits,
      objectives: state.objectives,
      reviews: state.reviews,
      unlockedVisualizations: state.unlockedVisualizations,
      systemPrompt: state.systemPrompt
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (e) {
    console.error("PGOS: Failed to save state", e);
  }
};

export const exportData = (state: AppState) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `pgos_backup_${state.user?.id || 'guest'}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const calculateReflectionDensity = (logs: DailyLog[]): number => {
  if (logs.length === 0) return 0;
  const meaningfulLogs = logs.filter(l => l.reflection.win.length > 5 || l.reflection.lesson.length > 5);
  return meaningfulLogs.length / logs.length;
};
