import { useState } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface RaJoinsRenameProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function RaJoinsRename({ executeQuery, executeSilentQuery }: RaJoinsRenameProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const runInnerJoin = () => handleRun("SELECT e.emp_name, d.dept_name\nFROM Employees e\nJOIN Departments d ON e.department_id = d.id;");
  const runLeftJoin = () => handleRun("SELECT e.emp_name, d.dept_name\nFROM Employees e\nLEFT JOIN Departments d ON e.department_id = d.id;");
  const runRename = () => handleRun("SELECT emp_name AS 'Worker Name', salary AS 'Compensation'\nFROM Employees;");

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">JOINS (⨝) & RENAME (ρ)</h3>
        <p className="scenario-desc">
          <strong>Joins (⨝)</strong> combine rows from two relations based on a related column (equivalent to Cartesian Product followed by a Selection). <br/>
          <strong>Rename (ρ)</strong> alters the name of an attribute or relation in the result set (the SQL <code>AS</code> keyword).
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        <div className="live-state-panel">
          <div className="live-state-header text-blue-400">Join Operations</div>
          
          <div className="text-sm text-slate-400 mb-6 flex-grow leading-relaxed">
            <p className="mb-3"><strong>Inner Join:</strong> Returns only employees who belong to a valid department. It drops unmatched records from both tables.</p>
            <p className="mb-3"><strong>Left Join:</strong> Returns ALL employees, and matches the department if it exists. (Notice employee 'Eve' who has no department; she will still appear but with a NULL department name).</p>
            <p><strong>Rename:</strong> Formats the output columns to be more human-readable without altering the underlying table schema.</p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button onClick={runInnerJoin} className="btn-action bg-blue-600 hover:bg-blue-500 flex justify-between items-center">
              <span>1. Inner Join (⨝)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">E ⨝ D</code>
            </button>
            <button onClick={runLeftJoin} className="btn-action bg-cyan-600 hover:bg-cyan-500 flex justify-between items-center">
              <span>2. Left Outer Join (⟕)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">E ⟕ D</code>
            </button>
            <button onClick={runRename} className="btn-action bg-teal-600 hover:bg-teal-500 flex justify-between items-center">
              <span>3. Rename (ρ)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">ρ Worker(name, comp)</code>
            </button>
          </div>
        </div>

        <SqlTerminal history={history} title="SQL Engine" statusColor="bg-blue-500" onRun={handleRun} />
      </div>
    </div>
  );
}
