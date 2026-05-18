'use client';

import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import AcidSuite from '@/components/AcidSuite';
import RelationalAlgebraSuite from '@/components/RelationalAlgebraSuite';
import SqlFluencySuite from '@/components/SqlFluencySuite';
import NormalizationSuite from '@/components/NormalizationSuite';
import ErdSuite from '@/components/ErdSuite';
import IndexingSuite from '@/components/IndexingSuite';
import { CheckCircle2, ChevronRight, CircleDot, RotateCcw } from 'lucide-react';

type ModuleId = 'ACID' | 'RA' | 'SQL' | 'NORM' | 'ERD' | 'IDX';

const ALL_MODULES: { id: ModuleId; label: string }[] = [
  { id: 'ACID', label: 'ACID Engine' },
  { id: 'RA', label: 'Relational Algebra' },
  { id: 'SQL', label: 'SQL Fluency' },
  { id: 'NORM', label: 'Normalization' },
  { id: 'ERD', label: 'ER Diagrams' },
  { id: 'IDX', label: 'Indexing Patterns' }
];

export default function Home() {
  const { isReady, executeQuery, executeSilentQuery, simulateCrash, SQLStatic, savedDiskState } = useDatabase();
  const [activeModule, setActiveModule] = useState<ModuleId>('IDX');
  const [completedModules, setCompletedModules] = useState<ModuleId[]>(['ACID', 'RA', 'SQL', 'NORM', 'ERD']);

  const resetProgress = () => {
    setCompletedModules([]);
    setActiveModule('ACID');
  };

  const handleNext = () => {
    if (!completedModules.includes(activeModule)) {
      setCompletedModules([...completedModules, activeModule]);
    }
    const currentIndex = ALL_MODULES.findIndex(m => m.id === activeModule);
    if (currentIndex < ALL_MODULES.length - 1) {
      setActiveModule(ALL_MODULES[currentIndex + 1].id);
    }
  };

  const modules = ALL_MODULES.map((mod, index) => {
    const isCompleted = completedModules.includes(mod.id);
    const isActive = activeModule === mod.id;
    // Unlocked if it's the first module, or the previous module is completed
    const isUnlocked = index === 0 || completedModules.includes(ALL_MODULES[index - 1].id) || isCompleted;
    
    return {
      ...mod,
      status: isCompleted ? 'completed' : isActive ? 'active' : isUnlocked ? 'active' : 'locked' // treating unlocked as active to click
    };
  });

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center text-indigo-400">Booting Database Engine...</div>;
  }

  const completedCount = modules.filter(m => m.status === 'completed').length;
  const progressPercentage = Math.round((completedCount / modules.length) * 100);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-12">
      {/* Global Progress Bar Navigation */}
      <nav className="bg-[#0b0f19] border-b border-slate-800 px-6 pt-6 pb-12 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          {/* Header & Percentage */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-3">
              <span className="bg-indigo-600 text-white px-2 py-1 rounded">DBMS</span>
              Final Prep
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={resetProgress}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors uppercase tracking-widest px-3 py-2 rounded border border-slate-700 hover:border-rose-500/50 hover:bg-rose-950/30"
              >
                <RotateCcw size={14} /> Reset
              </button>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-4 py-2 rounded-full shadow-inner">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</div>
                <div className="text-emerald-400 font-bold text-lg">{progressPercentage}%</div>
              </div>
            </div>
          </div>
          
          {/* Visual Stepper */}
          <div className="relative flex items-center justify-between w-full mt-2 px-4 md:px-8">
            {/* Background Line */}
            <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 h-1 bg-slate-800 -z-10 rounded-full" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute left-[5%] top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500 -z-10 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              style={{ width: `${Math.max(0, progressPercentage - 10)}%` }} 
            />

            {modules.map((mod, index) => {
              const isActive = activeModule === mod.id;
              const isCompleted = mod.status === 'completed';
              
              return (
                <div 
                  key={mod.id} 
                  className="flex flex-col items-center gap-3 relative z-10 cursor-pointer group"
                  onClick={() => mod.status !== 'locked' && setActiveModule(mod.id)}
                >
                  {/* Step Node */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                    isActive ? 'bg-indigo-900 border-indigo-500 text-indigo-300 scale-110 shadow-[0_0_20px_rgba(99,102,241,0.6)]' :
                    isCompleted ? 'bg-emerald-900 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                    'bg-slate-900 border-slate-800 text-slate-600 group-hover:border-slate-600'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={22} className="animate-fade-in" /> : <span className="font-bold text-sm">{index + 1}</span>}
                  </div>
                  
                  {/* Step Label */}
                  <div className={`absolute top-14 text-center whitespace-nowrap text-xs font-bold transition-colors duration-300 ${
                    isActive ? 'text-indigo-300 translate-y-1' :
                    isCompleted ? 'text-slate-300' :
                    'text-slate-600'
                  }`}>
                    {mod.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 mt-4">
        {activeModule === 'ACID' && (
          <AcidSuite 
            executeQuery={executeQuery}
            executeSilentQuery={executeSilentQuery}
            simulateCrash={simulateCrash}
            SQLStatic={SQLStatic}
            savedDiskState={savedDiskState}
          />
        )}
        {activeModule === 'RA' && (
          <RelationalAlgebraSuite 
            executeQuery={executeQuery}
            executeSilentQuery={executeSilentQuery}
          />
        )}
        {activeModule === 'SQL' && (
          <SqlFluencySuite 
            executeQuery={executeQuery}
            executeSilentQuery={executeSilentQuery}
          />
        )}
        {activeModule === 'ERD' && (
          <ErdSuite 
            executeQuery={executeQuery}
            executeSilentQuery={executeSilentQuery}
          />
        )}
        {activeModule === 'NORM' && (
          <NormalizationSuite 
            executeQuery={executeQuery}
            executeSilentQuery={executeSilentQuery}
          />
        )}
        {activeModule === 'IDX' && (
          <IndexingSuite 
            executeQuery={executeQuery}
            executeSilentQuery={executeSilentQuery}
          />
        )}

        {/* Global Progression Control */}
        <div className="mt-12 flex justify-center border-t border-slate-800 pt-8">
          <button 
            onClick={handleNext}
            className="btn-action bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 px-8 py-4 text-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            Mark Module Complete & Continue <ChevronRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}
