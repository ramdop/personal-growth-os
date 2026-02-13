import React, { useState } from "react";
import { AppState } from "../types";
import { calculateReflectionDensity } from "../services/storage";
import { VISUALIZATION_RULES } from "../constants";
import { GlassCard } from "../components/GlassCard";
import { Lock, Unlock, ArrowRight, Info } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const Insights: React.FC<Props> = ({ state, updateState }) => {
  const [justification, setJustification] = useState("");
  const [selectedUnlockId, setSelectedUnlockId] = useState<string | null>(null);

  // Helper to check criteria
  const checkCriteria = (ruleId: string) => {
    const rule = Object.values(VISUALIZATION_RULES).find(
      (r) => r.id === ruleId,
    );
    if (!rule)
      return { eligible: false, remainingDays: 0, reflectionDensity: 0 };

    const daysLogged = state.logs.length;
    const density = calculateReflectionDensity(state.logs);
    const densityPercent = density * 100;

    return {
      eligible: daysLogged >= rule.daysRequired && densityPercent >= 70,
      remainingDays: Math.max(0, rule.daysRequired - daysLogged),
      reflectionDensity: densityPercent,
    };
  };

  const handleUnlock = (ruleId: string) => {
    if (justification.length < 10)
      return alert("Please justify why you need this metric.");
    updateState((prev) => ({
      ...prev,
      unlockedVisualizations: [...prev.unlockedVisualizations, ruleId],
    }));
    setSelectedUnlockId(null);
    setJustification("");
  };

  const renderLockedCard = (rule: any) => {
    const status = checkCriteria(rule.id);
    const isUnlocked = state.unlockedVisualizations.includes(rule.id);

    if (isUnlocked) return null; // Render chart instead

    return (
      <GlassCard
        key={rule.id}
        className="relative group overflow-hidden"
        hoverEffect={true}
      >
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
          {status.eligible ? (
            <div className="space-y-4 max-w-sm animate-fade-in">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-300 mb-2">
                <Unlock size={24} />
              </div>
              <h3 className="text-xl font-medium text-primary">
                Unlock Available
              </h3>
              <p className="text-sm text-muted">
                You have gathered enough signal. One last step.
              </p>

              {selectedUnlockId === rule.id ? (
                <div className="mt-4 w-full">
                  <p className="text-xs text-left mb-2 text-primary/60">
                    Decision Test: What decision does this help you make better?
                  </p>
                  <input
                    className="w-full bg-primary/5 border border-primary/20 rounded p-2 text-sm mb-2 focus:outline-none text-primary"
                    placeholder="This visualization will help me..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                  />
                  <button
                    onClick={() => handleUnlock(rule.id)}
                    className="w-full bg-primary text-glass-surface py-2 rounded text-sm font-bold hover:opacity-90"
                  >
                    Permanently Unlock
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedUnlockId(rule.id)}
                  className="mt-4 px-6 py-2 border border-primary/30 rounded-full hover:bg-primary/10 transition-colors text-primary"
                >
                  Claim Visualization
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Lock className="w-8 h-8 text-muted mx-auto mb-2" />
              <h3 className="text-lg font-medium text-primary/50">
                {rule.title} Locked
              </h3>
              <div className="text-xs text-left bg-primary/5 p-4 rounded mt-4 space-y-2 w-full max-w-xs border border-primary/5">
                <div className="flex justify-between">
                  <span className="text-muted">Data Points</span>
                  <span
                    className={
                      status.remainingDays === 0
                        ? "text-emerald-500"
                        : "text-primary"
                    }
                  >
                    {state.logs.length}/{rule.daysRequired}
                  </span>
                </div>
                <div className="w-full bg-primary/5 h-1 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/20"
                    style={{
                      width: `${
                        (state.logs.length / rule.daysRequired) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-muted">Reflection Density</span>
                  <span
                    className={
                      status.reflectionDensity >= 70
                        ? "text-emerald-500"
                        : "text-primary"
                    }
                  >
                    {Math.round(status.reflectionDensity)}% / 70%
                  </span>
                </div>
                <div className="w-full bg-primary/5 h-1 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/20"
                    style={{
                      width: `${Math.min(100, status.reflectionDensity)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted mt-2 italic">
                "More reflection needed before trends emerge."
              </p>
            </div>
          )}
        </div>
        {/* Blurred preview background */}
        <div className="opacity-10 blur-sm pointer-events-none">
          <div className="h-48 w-full bg-primary/10 rounded"></div>
        </div>
      </GlassCard>
    );
  };

  // --- Chart Data Preparation ---

  // 1. Weekly Aggregates
  const weeklyData = React.useMemo(() => {
    const weeks: Record<
      string,
      { name: string; deepWork: number; presence: number }
    > = {};
    state.logs.forEach((log) => {
      const date = new Date(log.date);
      // Get week number
      const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
      );
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      const key = `${d.getUTCFullYear()}-W${weekNo}`;

      if (!weeks[key]) weeks[key] = { name: key, deepWork: 0, presence: 0 };
      weeks[key].deepWork += log.deepWorkMinutes;
      if (log.reps.presence) weeks[key].presence += 1;
    });
    return Object.values(weeks).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.logs]);

  // 2. Habit Heatmap - Simplified as a grid of squares for the last 30 days
  const last30Days = React.useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = state.logs.find((l) => l.date === dateStr);
      days.push({ date: dateStr, count: log ? log.habitsCompleted.length : 0 });
    }
    return days;
  }, [state.logs]);

  // 3. Energy vs Output
  const scatterData = React.useMemo(() => {
    return state.logs.map((log) => ({
      x: log.energy,
      y: log.deepWorkMinutes,
      z: 1, // bubble size
      mood: log.mood,
    }));
  }, [state.logs]);

  return (
    <div className="space-y-8">
      <GlassCard className="mb-8">
        <div className="flex items-start gap-4">
          <Info className="text-primary/40 shrink-0 mt-1" />
          <p className="text-sm text-muted">
            Visualizations are tools for specific questions. They are hidden by
            default to prevent you from optimizing for the graph instead of the
            reality.
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-8">
        {/* --- Weekly Aggregates --- */}
        {true ||
        state.unlockedVisualizations.includes(
          VISUALIZATION_RULES.WEEKLY_AGGREGATES.id,
        ) ? (
          <GlassCard title="Weekly Deep Work & Presence" hoverEffect={true}>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis
                    dataKey="name"
                    stroke="var(--chart-stroke)"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--chart-stroke)"
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    contentStyle={{
                      backgroundColor: "rgba(20, 20, 25, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#rgba(255, 255, 255, 0.8)" }}
                  />
                  <Bar
                    dataKey="deepWork"
                    fill="#a58e7e"
                    name="Deep Work (m)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="presence"
                    fill="#7ea586"
                    name="Presence Reps"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted mt-4 text-center">
              Are you compounding focus or fragmentation?
            </p>
          </GlassCard>
        ) : (
          renderLockedCard(VISUALIZATION_RULES.WEEKLY_AGGREGATES)
        )}

        {/* --- Habit Heatmap --- */}
        {true ||
        state.unlockedVisualizations.includes(
          VISUALIZATION_RULES.HABIT_HEATMAP.id,
        ) ? (
          <GlassCard
            title="Identity Consistency (Last 30 Days)"
            hoverEffect={true}
          >
            <div className="mt-4 flex flex-wrap gap-1 justify-center">
              {last30Days.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} habits`}
                  className={`w-8 h-8 rounded-sm transition-all hover:scale-110 ${
                    day.count === 0
                      ? "bg-primary/10"
                      : day.count <= 2
                      ? "bg-emerald-500/40"
                      : day.count <= 4
                      ? "bg-emerald-500/70"
                      : "bg-emerald-400"
                  }`}
                />
              ))}
            </div>
          </GlassCard>
        ) : (
          renderLockedCard(VISUALIZATION_RULES.HABIT_HEATMAP)
        )}

        {/* --- Energy vs Output --- */}
        {true ||
        state.unlockedVisualizations.includes(
          VISUALIZATION_RULES.ENERGY_OUTPUT.id,
        ) ? (
          <GlassCard title="Energy vs. Output Correlation" hoverEffect={true}>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Energy"
                    unit=""
                    domain={[0, 6]}
                    stroke="var(--chart-stroke)"
                    tickCount={6}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Deep Work"
                    unit="m"
                    stroke="var(--chart-stroke)"
                  />
                  <Tooltip
                    cursor={{
                      strokeDasharray: "3 3",
                      stroke: "rgba(255,255,255,0.2)",
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(20, 20, 25, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#rgba(255, 255, 255, 0.8)" }}
                  />
                  <Scatter name="Days" data={scatterData} fill="#7E9aa5" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted mt-4 text-center">
              Do you need high energy to produce, or can you ship when tired?
            </p>
          </GlassCard>
        ) : (
          renderLockedCard(VISUALIZATION_RULES.ENERGY_OUTPUT)
        )}
      </div>
    </div>
  );
};
