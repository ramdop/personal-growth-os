
import React from 'react';
import { AppState } from '../types';
import { GlassCard } from '../components/GlassCard';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  state: AppState;
}

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedIn = state.logs.some(l => l.date === today);
  
  // Weekly stats logic
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyLogs = state.logs.filter(l => new Date(l.date) >= oneWeekAgo);
  
  const presenceReps = weeklyLogs.filter(l => l.reps.presence).length;
  const deepWorkTotal = weeklyLogs.reduce((acc, curr) => acc + curr.deepWorkMinutes, 0);
  const buildDays = weeklyLogs.filter(l => l.reps.build).length;
  
  const lastAdjustment = state.reviews.length > 0 
    ? state.reviews[state.reviews.length - 1].adjustment 
    : "No weekly reviews recorded yet.";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Primary Status Card */}
      <GlassCard className="col-span-1 md:col-span-2 border-l-4 border-l-emerald-500/50" hoverEffect={true}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${hasCheckedIn ? 'bg-emerald-500/20 text-emerald-500' : 'bg-primary/5 text-muted'}`}>
            {hasCheckedIn ? <CheckCircle2 size={32} /> : <Circle size={32} />}
          </div>
          <div>
            <h3 className="text-2xl font-serif text-primary">
              {hasCheckedIn ? "Protocol Complete" : "Alignment Pending"}
            </h3>
            <p className="text-muted mt-1">
              {hasCheckedIn 
                ? "You have cast a vote for your identity today." 
                : "The day is not over. Capture the signal before it fades."}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Trailing 7 Days Text Summary */}
      <GlassCard title="Last 7 Days (Signal)" hoverEffect={true}>
        <div className="space-y-4">
          <div className="flex justify-between items-baseline border-b border-glass-border pb-2">
            <span className="text-muted">Presence Reps</span>
            <span className="text-xl font-medium text-primary">{presenceReps}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-glass-border pb-2">
            <span className="text-muted">Deep Work</span>
            <span className="text-xl font-medium text-primary">{Math.floor(deepWorkTotal / 60)}h {deepWorkTotal % 60}m</span>
          </div>
          <div className="flex justify-between items-baseline pb-2">
            <span className="text-muted">Builder Days</span>
            <span className="text-xl font-medium text-primary">{buildDays}</span>
          </div>
        </div>
      </GlassCard>

      {/* Weekly Focus */}
      <GlassCard title="Weekly Adjustment" hoverEffect={true}>
        <div className="h-full flex flex-col justify-center">
          <p className="text-lg italic font-serif leading-relaxed text-primary">
            "{lastAdjustment}"
          </p>
        </div>
      </GlassCard>

      {/* Active Objectives Snapshot */}
      <GlassCard title="Active Objectives" className="col-span-1 md:col-span-2" hoverEffect={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {state.objectives.filter(o => o.active).length === 0 ? (
             <p className="text-muted">No active objectives set.</p>
          ) : (
            state.objectives.filter(o => o.active).slice(0, 3).map(obj => (
              <div key={obj.id} className="bg-primary/5 p-4 rounded-lg border border-glass-border">
                <span className="text-xs uppercase tracking-widest text-muted mb-2 block">{obj.theme}</span>
                <h4 className="font-medium mb-1 text-primary">{obj.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <ArrowUpRight size={12} />
                  <span>{obj.keyResults.length} Key Results</span>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
};
