
import React, { useState } from 'react';
import { AppState, WeeklyReview } from '../types';
import { GlassCard } from '../components/GlassCard';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const WeeklyReviewView: React.FC<Props> = ({ state, updateState }) => {
  // Logic to find current week's data could be complex, simplifying to "Last 7 Days" context
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const relevantLogs = state.logs.filter(l => new Date(l.date) >= oneWeekAgo);

  const [form, setForm] = useState<WeeklyReview>({
    id: '',
    weekStartDate: new Date().toISOString().split('T')[0], // simplifying for demo
    wins: '',
    misses: '',
    learnings: '',
    adjustment: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateState(prev => ({
      ...prev,
      reviews: [...prev.reviews, { ...form, id: Date.now().toString() }]
    }));
    alert("Review Saved. Reflection compounded.");
    setForm({ ...form, wins: '', misses: '', learnings: '', adjustment: '' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-1 space-y-6">
        <GlassCard title="Context: Last 7 Days">
          <div className="space-y-4 text-sm">
             <p className="text-muted">Logs Recorded: <span className="text-primary">{relevantLogs.length}</span></p>
             <div>
                <strong className="block text-primary/60 mb-1">Top Priorities Recorded:</strong>
                <ul className="list-disc pl-4 text-muted space-y-1">
                  {relevantLogs.map((l, i) => <li key={i}>{l.reflection.priority || 'No priority set'}</li>)}
                </ul>
             </div>
             <div>
                <strong className="block text-primary/60 mb-1">Deep Work Sum:</strong>
                <span className="text-xl text-primary">{Math.floor(relevantLogs.reduce((a,b) => a + b.deepWorkMinutes, 0) / 60)} hours</span>
             </div>
          </div>
        </GlassCard>
      </div>

      <div className="md:col-span-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassCard title="Reflection Engine">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-2">Wins (What worked?)</label>
                <textarea 
                  className="w-full bg-primary/5 border border-primary/10 rounded p-3 focus:outline-none focus:border-primary/30 h-24 text-primary"
                  value={form.wins}
                  onChange={e => setForm({...form, wins: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-2">Misses (What didn't?)</label>
                <textarea 
                  className="w-full bg-primary/5 border border-primary/10 rounded p-3 focus:outline-none focus:border-primary/30 h-24 text-primary"
                  value={form.misses}
                  onChange={e => setForm({...form, misses: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-2">Learnings (The Signal)</label>
                <textarea 
                  className="w-full bg-primary/5 border border-primary/10 rounded p-3 focus:outline-none focus:border-primary/30 h-24 text-primary"
                  value={form.learnings}
                  onChange={e => setForm({...form, learnings: e.target.value})}
                  required
                />
              </div>
              <div className="pt-4 border-t border-primary/10">
                <label className="block text-sm font-medium text-emerald-600 dark:text-emerald-200 mb-2">Next Week's 1 Adjustment</label>
                <input 
                  className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded p-3 focus:outline-none focus:border-emerald-500/50 text-emerald-900 dark:text-emerald-100 placeholder-emerald-800/50 dark:placeholder-emerald-200/50"
                  value={form.adjustment}
                  onChange={e => setForm({...form, adjustment: e.target.value})}
                  required
                  placeholder="One change only."
                />
              </div>
            </div>
          </GlassCard>
          <button type="submit" className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 py-4 rounded-xl transition-all text-primary">
            Lock Review
          </button>
        </form>
      </div>
    </div>
  );
};
