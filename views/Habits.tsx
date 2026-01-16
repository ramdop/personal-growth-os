
import React, { useState } from 'react';
import { AppState, Habit, LogType } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Plus, Trash2, Power } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const Habits: React.FC<Props> = ({ state, updateState }) => {
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCat, setNewHabitCat] = useState<LogType>('builder');

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      category: newHabitCat,
      active: true
    };
    updateState(prev => ({ ...prev, habits: [...prev.habits, habit] }));
    setNewHabitName('');
  };

  const toggleActive = (id: string) => {
    updateState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === id ? { ...h, active: !h.active } : h)
    }));
  };

  const deleteHabit = (id: string) => {
    if (!confirm('Delete this habit definition?')) return;
    updateState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      <GlassCard title="Configure Identity Stack">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Habit Name (e.g., Read 10 pages)" 
            className="flex-1 bg-primary/5 border border-primary/10 rounded p-3 focus:outline-none focus:border-primary/30 text-primary"
            value={newHabitName}
            onChange={e => setNewHabitName(e.target.value)}
          />
          <select 
            className="bg-primary/5 border border-primary/10 rounded p-3 text-primary focus:outline-none"
            value={newHabitCat}
            onChange={e => setNewHabitCat(e.target.value as LogType)}
          >
            <option value="presence">Presence</option>
            <option value="builder">Builder</option>
            <option value="health">Health</option>
            <option value="mind">Mind</option>
          </select>
          <button onClick={addHabit} className="bg-primary/10 hover:bg-primary/20 px-6 py-3 rounded border border-primary/20 transition-colors text-primary">
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {state.habits.map(habit => (
            <div key={habit.id} className={`flex items-center justify-between p-4 rounded-lg border ${habit.active ? 'bg-primary/5 border-primary/5' : 'bg-transparent border-primary/5 opacity-50'}`}>
              <div>
                <h4 className="font-medium text-primary">{habit.name}</h4>
                <span className="text-xs text-muted uppercase tracking-wider">{habit.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(habit.id)} className="p-2 hover:bg-primary/10 rounded text-muted">
                  <Power size={16} />
                </button>
                <button onClick={() => deleteHabit(habit.id)} className="p-2 hover:bg-red-500/20 hover:text-red-300 rounded text-muted transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {state.habits.length === 0 && <p className="text-center text-muted py-8">No habits defined. Add one to start building identity.</p>}
        </div>
      </GlassCard>
    </div>
  );
};
