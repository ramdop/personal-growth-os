
import { AppState, DailyLog, Habit, Objective, WeeklyReview } from '../types';
import { DEFAULT_SYSTEM_PROMPT } from '../constants';

// ==========================================================================
// PRODUCTION IMPLEMENTATION (SUPABASE JSON BLOB)
// ==========================================================================

import { supabase } from './supabase';

const DEFAULT_STATE_DATA = {
  theme: 'dark' as const,
  logs: [],
  habits: [],
  objectives: [],
  reviews: [],
  unlockedVisualizations: [],
  systemPrompt: DEFAULT_SYSTEM_PROMPT
};

export const loadState = async (userId: string | null): Promise<AppState> => {
  if (!userId) return { user: null, ...DEFAULT_STATE_DATA };

  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return { user: { id: userId, email: '', name: '' }, ...DEFAULT_STATE_DATA };
  return { user: { id: userId, email: '', name: '' }, ...DEFAULT_STATE_DATA, ...data.data };
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

// ==========================================================================
// MOCK IMPLEMENTATION (LOCAL STORAGE) - DISABLED
// ==========================================================================

/*
// Data is now namespaced by User ID
const getStorageKey = (userId: string) => `pgos_data_${userId}`;

export const loadState = (userId: string | null): AppState => {
  // ... (Mock implementation hidden)
  return { user: null, ...DEFAULT_STATE_DATA };
};

export const saveState = (state: AppState) => {
  // ...
};
*/

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
