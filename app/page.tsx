'use client';

import { useState } from 'react';
import Walkthrough from '@/components/Walkthrough';
import SqlTerminal from '@/components/SqlTerminal';
import { useDatabase } from '@/hooks/useDatabase';
import { QueryExecResult } from 'sql.js';

export type HistoryItem = {
  id: number;
  query: string;
  results: QueryExecResult[] | null;
  error: string | null;
};

export default function Home() {
  const { isReady, executeQuery, simulateCrash, inTransaction } = useDatabase();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const runCommand = (query: string) => {
    if (!isReady || !query.trim()) return;
    const { results, error } = executeQuery(query);
    
    setHistory(prev => [...prev, {
      id: Date.now(),
      query,
      results,
      error
    }]);
  };

  const triggerCrash = () => {
    const msg = simulateCrash();
    if (msg) {
      setHistory(prev => [...prev, {
        id: Date.now(),
        query: '-- SYSTEM EVENT --',
        results: null,
        error: msg
      }]);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto">
      <header className="mb-8 text-center animate-fade-in">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-blue-400 drop-shadow-md pb-2">
          ACID MySQL Simulator
        </h1>
        <p className="text-gray-400 mt-2 font-medium">Learn By Doing (Effortless Walkthrough)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        <div className="h-[600px]">
          <Walkthrough 
            onRunCommand={runCommand}
            inTransaction={inTransaction}
            onCrash={triggerCrash}
          />
        </div>
        <div className="h-[600px]">
          <SqlTerminal 
            history={history}
            onRun={runCommand}
            isReady={isReady} 
          />
        </div>
      </div>
    </main>
  );
}
