import { useState } from 'react';
import { QueryExecResult, SqlJsStatic } from 'sql.js';

import AtomicityScenario from '@/components/AtomicityScenario';
import ConsistencyScenario from '@/components/ConsistencyScenario';
import IsolationScenario from '@/components/IsolationScenario';
import DurabilityScenario from '@/components/DurabilityScenario';

export type HistoryItem = {
  id: number;
  query: string;
  results: QueryExecResult[] | null;
  error: string | null;
  affectedRows?: number;
};

type TabId = 'A' | 'C' | 'I' | 'D';

interface AcidSuiteProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  simulateCrash: () => string | undefined;
  SQLStatic: SqlJsStatic | null;
  savedDiskState: Uint8Array | null;
}

export default function AcidSuite({ executeQuery, executeSilentQuery, simulateCrash, SQLStatic, savedDiskState }: AcidSuiteProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('A');

  const runCommand = (query: string) => {
    if (!query.trim()) return;
    const { results, error } = executeQuery(query);
    
    let affectedRows = 0;
    const upper = query.toUpperCase();
    if (!error && (upper.includes('UPDATE') || upper.includes('INSERT') || upper.includes('DELETE'))) {
      affectedRows = 1;
    }

    setHistory(prev => [...prev, {
      id: Date.now(),
      query,
      results,
      error,
      affectedRows
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

  const tabs = [
    { id: 'A', label: 'Atomicity (All-or-Nothing)' },
    { id: 'C', label: 'Consistency (System Rules)' },
    { id: 'I', label: 'Isolation (Concurrent Sessions)' },
    { id: 'D', label: 'Durability (Crash Logs)' }
  ] as const;

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h1 className="suite-header">ACID Multi-Dimensional Engine Suite</h1>
        <p className="suite-subtitle">Every database transaction is governed by four core pillars. Click any card below to test them.</p>
      </header>

      {/* Tabs */}
      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setHistory([]); // clear history on tab change
            }}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="mt-2 relative">
        {activeTab === 'A' && (
          <AtomicityScenario 
            history={history} 
            onRunCommand={runCommand} 
            executeSilentQuery={executeSilentQuery} 
          />
        )}
        {activeTab === 'C' && (
          <ConsistencyScenario 
            history={history} 
            onRunCommand={runCommand} 
            executeSilentQuery={executeSilentQuery} 
          />
        )}
        {activeTab === 'I' && (
          <IsolationScenario 
            historyA={history} 
            onRunCommandA={runCommand} 
            SQLStatic={SQLStatic}
            savedDiskState={savedDiskState}
          />
        )}
        {activeTab === 'D' && (
          <DurabilityScenario 
            history={history} 
            onRunCommand={runCommand} 
            onCrash={triggerCrash}
            executeSilentQuery={executeSilentQuery}
          />
        )}
      </div>
    </div>
  );
}
