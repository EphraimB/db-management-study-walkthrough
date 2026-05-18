'use client';

import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import AcidSuite from '@/components/AcidSuite';
import RelationalAlgebraSuite from '@/components/RelationalAlgebraSuite';
import SqlFluencySuite from '@/components/SqlFluencySuite';
import NormalizationSuite from '@/components/NormalizationSuite';
import ErdSuite from '@/components/ErdSuite';
import { CheckCircle2, ChevronRight, CircleDot } from 'lucide-react';

type ModuleId = 'ERD' | 'NORM' | 'ACID' | 'RA' | 'SQL';

export default function Home() {
  const { isReady, executeQuery, executeSilentQuery, simulateCrash, SQLStatic, savedDiskState } = useDatabase();
  const [activeModule, setActiveModule] = useState<ModuleId>('ERD');

  const modules: { id: ModuleId; label: string; status: 'completed' | 'active' | 'locked' }[] = [
    { id: 'ACID', label: 'ACID Engine', status: 'completed' },
    { id: 'RA', label: 'Relational Algebra', status: 'completed' },
    { id: 'SQL', label: 'SQL Fluency', status: 'completed' },
    { id: 'ERD', label: 'ER Diagrams', status: 'active' },
    { id: 'NORM', label: 'Normalization', status: 'completed' }
  ];

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center text-indigo-400">Booting Database Engine...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      {/* Global Progress Bar Navigation */}
      <nav className="bg-[#0b0f19] border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
          <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest mr-4 shrink-0">
            DBMS Final Prep
          </div>
          
          <div className="flex items-center gap-2 text-sm font-medium shrink-0">
            {modules.map((mod, index) => (
              <div key={mod.id} className="flex items-center gap-2">
                <button 
                  onClick={() => mod.status !== 'locked' && setActiveModule(mod.id)}
                  disabled={mod.status === 'locked'}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                    mod.status === 'locked' ? 'opacity-50 cursor-not-allowed text-slate-500' :
                    activeModule === mod.id ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' :
                    mod.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60' :
                    'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mod.status === 'completed' && <CheckCircle2 size={16} />}
                  {mod.status === 'active' && <CircleDot size={16} />}
                  {mod.label}
                </button>
                {index < modules.length - 1 && (
                  <ChevronRight size={16} className="text-slate-600" />
                )}
              </div>
            ))}
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
      </main>
    </div>
  );
}
