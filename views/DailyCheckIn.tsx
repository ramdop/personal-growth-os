
import React, { useState } from 'react';
import { AppState, DailyLog } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Save } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  onComplete: () => void;
}

export const DailyCheckIn: React.FC<Props> = ({ state, updateState, onComplete }) => {
  const today = new Date().toISOString().split('T')[0];
  const existingLog = state.logs.find(l => l.date === today);

  const [formData, setFormData] = useState<DailyLog>(existingLog || {
    date: today,
    mood: 3,
    energy: 3,
    deepWorkMinutes: 0,
    reps: {
      presence: false,
      build: false,
      workout: false,
      freedive: false,
    },
    reflection: {
      win: '',
      lesson: '',
      priority: '',
    },
    habitsCompleted: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateState(prev => {
      const otherLogs = prev.logs.filter(l => l.date !== today);
      return {
        ...prev,
        logs: [...otherLogs, formData]
      };
    });
    onComplete();
  };

  const handleRangeChange = (field: 'mood' | 'energy', value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <GlassCard title="Internal State">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-sm text-muted mb-2">Mood (1-5)</label>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleRangeChange('mood', n)}
                  className={`w-10 h-10 rounded-full border border-primary/10 transition-all ${formData.mood === n ? 'bg-primary text-glass-surface' : 'bg-primary/5 hover:bg-primary/10 text-primary'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">Energy (1-5)</label>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleRangeChange('energy', n)}
                  className={`w-10 h-10 rounded-full border border-primary/10 transition-all ${formData.energy === n ? 'bg-primary text-glass-surface' : 'bg-primary/5 hover:bg-primary/10 text-primary'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="Output & Reps">
        <div className="mb-6">
          <label className="block text-sm text-muted mb-2">Deep Work (Minutes)</label>
          <input 
            type="number" 
            className="w-full bg-primary/5 border border-primary/10 rounded p-3 text-lg focus:outline-none focus:border-primary/30 text-primary"
            value={formData.deepWorkMinutes}
            onChange={e => setFormData({...formData, deepWorkMinutes: parseInt(e.target.value) || 0})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.reps).map(([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData(prev => ({...prev, reps: {...prev.reps, [key]: !val}}))}
              className={`p-4 rounded-lg border text-left transition-all ${val ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500 dark:text-emerald-100' : 'bg-primary/5 border-primary/10 hover:bg-primary/10 text-primary'}`}
            >
              <span className="capitalize">{key} Rep</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Habits (Identity)">
        <div className="space-y-2">
           {state.habits.filter(h => h.active).length === 0 && <p className="text-sm text-muted">No active habits configured.</p>}
           {state.habits.filter(h => h.active).map(habit => {
             const isDone = formData.habitsCompleted.includes(habit.id);
             return (
               <div key={habit.id} 
                    onClick={() => {
                      const newHabits = isDone 
                        ? formData.habitsCompleted.filter(id => id !== habit.id)
                        : [...formData.habitsCompleted, habit.id];
                      setFormData({...formData, habitsCompleted: newHabits});
                    }}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${isDone ? 'bg-primary/10' : 'hover:bg-primary/5'}`}>
                 <div className={`w-5 h-5 rounded border border-primary/30 flex items-center justify-center ${isDone ? 'bg-primary text-glass-surface' : ''}`}>
                   {isDone && <Save size={12} />}
                 </div>
                 <span className="text-primary">{habit.name}</span>
                 <span className="text-xs uppercase text-muted ml-auto">{habit.category}</span>
               </div>
             )
           })}
        </div>
      </GlassCard>

      <GlassCard title="Reflection">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Biggest Win</label>
            <textarea 
              className="w-full bg-primary/5 border border-primary/10 rounded p-3 focus:outline-none focus:border-primary/30 h-24 text-primary"
              value={formData.reflection.win}
              onChange={e => setFormData({...formData, reflection: {...formData.reflection, win: e.target.value}})}
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Key Lesson</label>
            <textarea 
              className="w-full bg-primary/5 border border-primary/10 rounded p-3 focus:outline-none focus:border-primary/30 h-24 text-primary"
              value={formData.reflection.lesson}
              onChange={e => setFormData({...formData, reflection: {...formData.reflection, lesson: e.target.value}})}
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Tomorrow's Top Priority</label>
            <input 
              type="text"
              className="w-full bg-primary/5 border border-primary/10 rounded p-3 focus:outline-none focus:border-primary/30 text-primary"
              value={formData.reflection.priority}
              onChange={e => setFormData({...formData, reflection: {...formData.reflection, priority: e.target.value}})}
            />
          </div>
        </div>
      </GlassCard>

      <button type="submit" className="w-full bg-primary text-glass-surface font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/10">
        Commit Log
      </button>
    </form>
  );
};
