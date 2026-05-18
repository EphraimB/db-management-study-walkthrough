import { useState } from 'react';
import { QueryExecResult } from 'sql.js';

import SqlAggregation from './SqlAggregation';
import SqlAdvancedSelection from './SqlAdvancedSelection';
import SqlAdvancedFeatures from './SqlAdvancedFeatures';

interface SqlFluencySuiteProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

type TabId = 'AGG' | 'ADV' | 'FEAT';

export default function SqlFluencySuite({ executeQuery, executeSilentQuery }: SqlFluencySuiteProps) {
  const [activeTab, setActiveTab] = useState<TabId>('AGG');

  const tabs = [
    { id: 'AGG', label: 'Aggregation & Grouping' },
    { id: 'ADV', label: 'Advanced Selection & Subqueries' },
    { id: 'FEAT', label: 'CTEs & Views' }
  ] as const;

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h1 className="suite-header">SQL Fluency Engine</h1>
        <p className="suite-subtitle">Master practical query construction, aggregations, and advanced SQL features.</p>
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
        {activeTab === 'AGG' && <SqlAggregation executeQuery={executeQuery} executeSilentQuery={executeSilentQuery} />}
        {activeTab === 'ADV' && <SqlAdvancedSelection executeQuery={executeQuery} executeSilentQuery={executeSilentQuery} />}
        {activeTab === 'FEAT' && <SqlAdvancedFeatures executeQuery={executeQuery} executeSilentQuery={executeSilentQuery} />}
      </div>
    </div>
  );
}
