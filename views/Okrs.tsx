
import React, { useState } from 'react';
import { AppState, Objective, KeyResult, LogType } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Plus, ChevronDown, ChevronUp, Trash2, Info } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const Okrs: React.FC<Props> = ({ state, updateState }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // New Obj Form
  const [isAdding, setIsAdding] = useState(false);
  const [newObj, setNewObj] = useState<Partial<Objective>>({
    theme: 'builder',
    title: '',
    why: '',
  });

  const handleAddObjective = () => {
    if (!newObj.title || !newObj.why) return;
    const obj: Objective = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      theme: newObj.theme as LogType,
      title: newObj.title,
      why: newObj.why,
      active: true,
      keyResults: []
    };
    updateState(prev => ({...prev, objectives: [...prev.objectives, obj]}));
    setIsAdding(false);
    setNewObj({ theme: 'builder', title: '', why: '' });
  };

  const addKR = (objId: string) => {
    const title = prompt("Key Result Title:");
    if (!title) return;
    const target = prompt("Target (Qualitative or Quantitative):");
    if (!target) return;

    updateState(prev => ({
      ...prev,
      objectives: prev.objectives.map(o => {
        if (o.id !== objId) return o;
        return {
          ...o,
          keyResults: [...o.keyResults, {
            id: Date.now().toString(),
            title,
            target,
            current: 'Not started',
            confidence: 3
          }]
        };
      })
    }));
  };

  const deleteKR = (objId: string, krId: string) => {
    if (!confirm("Delete this Key Result?")) return;
    updateState(prev => ({
      ...prev,
      objectives: prev.objectives.map(o => o.id !== objId ? o : {
        ...o,
        keyResults: o.keyResults.filter(k => k.id !== krId)
      })
    }));
  };

  const deleteObjective = (e: React.MouseEvent, objId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this entire Objective and all its Key Results?")) return;
    updateState(prev => ({
      ...prev,
      objectives: prev.objectives.filter(o => o.id !== objId)
    }));
  };

  return (
    <div className="space-y-6">
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3 max-w-lg">
            <Info className="text-primary/40 shrink-0 mt-1" size={18} />
            <p className="text-sm text-muted">
              Objectives prevent local optimization. KRs are reflective checkpoints, not just numbers.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="shrink-0 bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded border border-primary/20 transition-colors flex items-center gap-2 text-primary text-sm font-medium"
          >
            <Plus size={16} /> New Objective
          </button>
        </div>
      </GlassCard>

      {isAdding && (
        <GlassCard className="animate-fade-in border-l-4 border-l-emerald-500/50">
          <div className="space-y-4">
            <h3 className="font-serif font-medium text-lg text-primary">Define New Objective</h3>
            <input 
              className="w-full bg-primary/5 border border-primary/10 rounded p-3 text-primary focus:outline-none focus:border-primary/30"
              placeholder="Objective Title (e.g., Become a prolific writer)"
              value={newObj.title}
              onChange={e => setNewObj({...newObj, title: e.target.value})}
              autoFocus
            />
            <textarea 
              className="w-full bg-primary/5 border border-primary/10 rounded p-3 h-24 text-primary focus:outline-none focus:border-primary/30"
              placeholder="Why this matters? (The 'Why' is crucial for resilience)"
              value={newObj.why}
              onChange={e => setNewObj({...newObj, why: e.target.value})}
            />
            <div className="flex justify-between gap-4">
              <select 
                className="bg-primary/5 border border-primary/10 rounded p-3 text-primary focus:outline-none"
                value={newObj.theme}
                onChange={e => setNewObj({...newObj, theme: e.target.value as LogType})}
              >
                <option value="builder">Builder</option>
                <option value="presence">Presence</option>
                <option value="health">Health</option>
                <option value="wealth">Wealth</option>
                <option value="mind">Mind</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-muted hover:text-primary transition-colors">Cancel</button>
                <button onClick={handleAddObjective} className="bg-primary text-glass-surface px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity">Save</button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {state.objectives.length === 0 && !isAdding && (
          <GlassCard className="text-center py-12">
              <p className="text-xl font-serif text-primary italic mb-2">"Objectives prevent local optimization."</p>
              <p className="text-sm text-muted">Define a theme to ensure your daily reps are compounding in the right direction.</p>
          </GlassCard>
      )}

      {state.objectives.map(obj => (
        <GlassCard 
          key={obj.id} 
          className="relative overflow-hidden group" 
          onClick={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
          hoverEffect={true}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 block px-2 py-1 rounded w-fit ${
                  obj.theme === 'builder' ? 'bg-blue-500/10 text-blue-400' :
                  obj.theme === 'health' ? 'bg-red-500/10 text-red-400' :
                  obj.theme === 'wealth' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
              }`}>{obj.theme}</span>
              <h3 className="text-xl font-medium text-primary flex items-center gap-2 font-serif">
                {obj.title}
              </h3>
              <p className="text-muted mt-2 italic border-l-2 border-primary/10 pl-3 text-sm">"{obj.why}"</p>
            </div>
            <div className="flex items-center gap-3 text-primary/40 pl-4">
              <button 
                onClick={(e) => deleteObjective(e, obj.id)}
                className="p-2 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Objective"
              >
                <Trash2 size={16} />
              </button>
              <div className="p-2 bg-primary/5 rounded-full">
                 {expandedId === obj.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          </div>

          {expandedId === obj.id && (
            <div className="mt-6 pt-6 border-t border-primary/5 space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-primary/70 uppercase tracking-wide">Key Results</h4>
                <button onClick={() => addKR(obj.id)} className="text-xs bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded text-primary font-medium transition-colors">+ Add Key Result</button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {obj.keyResults.map(kr => (
                  <div key={kr.id} className="bg-primary/5 p-4 rounded-lg group/kr border border-primary/5 hover:border-primary/10 transition-colors">
                    <div className="flex justify-between mb-3">
                      <span className="font-medium text-primary">{kr.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-primary/10 px-2 py-1 rounded text-primary font-mono">Conf: {kr.confidence}/5</span>
                        <button 
                          onClick={() => deleteKR(obj.id, kr.id)}
                          className="text-primary/20 hover:text-red-400 transition-colors p-1 opacity-0 group-hover/kr:opacity-100"
                          title="Delete Key Result"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted">
                      <div className="bg-primary/5 p-2 rounded px-3">
                          <span className="text-[10px] uppercase tracking-wide opacity-50 block mb-1">Target</span>
                          <span className="text-primary">{kr.target}</span>
                      </div>
                      <div className="bg-primary/5 p-2 rounded px-3">
                        <span className="text-[10px] uppercase tracking-wide opacity-50 block mb-1">Current Status</span>
                        <input 
                          className="bg-transparent border-b border-primary/20 focus:outline-none focus:border-primary/50 text-primary w-full py-0.5"
                          value={kr.current}
                          placeholder="Update progress..."
                          onChange={(e) => {
                            const val = e.target.value;
                            updateState(prev => ({
                              ...prev,
                              objectives: prev.objectives.map(o => o.id !== obj.id ? o : {
                                ...o,
                                keyResults: o.keyResults.map(k => k.id !== kr.id ? k : { ...k, current: val })
                              })
                            }))
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {obj.keyResults.length === 0 && <p className="text-sm text-muted italic text-center py-4">No Key Results defined yet. Add one to track progress.</p>}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
};
