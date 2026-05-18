import { useState } from 'react';
import { QueryExecResult } from 'sql.js';

import RaSelectProject from './RaSelectProject';
import RaSetOperations from './RaSetOperations';
import RaJoinsRename from './RaJoinsRename';

interface RelationalAlgebraSuiteProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

type TabId = 'SP' | 'SET' | 'JOIN';

export default function RelationalAlgebraSuite({ executeQuery, executeSilentQuery }: RelationalAlgebraSuiteProps) {
  const [activeTab, setActiveTab] = useState<TabId>('SP');

  const tabs = [
    { id: 'SP', label: 'Select (σ) & Project (π)' },
    { id: 'SET', label: 'Set Operations (∪, -, ×)' },
    { id: 'JOIN', label: 'Joins (⨝) & Rename (ρ)' }
  ] as const;

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h1 className="suite-header">Relational Algebra Engine</h1>
        <p className="suite-subtitle">Master the mathematical foundations of SQL. Translate formal algebraic operations into executable queries.</p>
      </header>

      {/* Tabs */}
      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="mt-2 relative">
        {activeTab === 'SP' && <RaSelectProject executeQuery={executeQuery} executeSilentQuery={executeSilentQuery} />}
        {activeTab === 'SET' && <RaSetOperations executeQuery={executeQuery} executeSilentQuery={executeSilentQuery} />}
        {activeTab === 'JOIN' && <RaJoinsRename executeQuery={executeQuery} executeSilentQuery={executeSilentQuery} />}
      </div>
    </div>
  );
}
