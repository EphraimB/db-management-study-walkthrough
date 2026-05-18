import { useState } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface SqlAdvancedSelectionProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function SqlAdvancedSelection({ executeQuery, executeSilentQuery }: SqlAdvancedSelectionProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const runLike = () => handleRun("SELECT emp_name FROM Employees WHERE emp_name LIKE 'A%';");
  const runSubquery = () => handleRun("SELECT emp_name, salary \nFROM Employees \nWHERE salary > (SELECT AVG(salary) FROM Employees);");
  const runExists = () => handleRun("SELECT dept_name \nFROM Departments d \nWHERE EXISTS (\n  SELECT 1 FROM Employees e WHERE e.department_id = d.id\n);");

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">ADVANCED SELECTION & SUBQUERIES</h3>
        <p className="scenario-desc">
          <strong>Pattern Matching:</strong> Use <code>LIKE</code> with wildcards (<code>%</code>) to match string patterns.<br/>
          <strong>Subqueries:</strong> Nest a query inside another query's <code>WHERE</code> clause to use dynamic criteria.<br/>
          <strong>EXISTS:</strong> A powerful operator that tests for the existence of any record in a subquery.
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        <div className="live-state-panel">
          <div className="live-state-header text-purple-400">Advanced Operators</div>
          
          <div className="text-sm text-slate-400 mb-6 flex-grow leading-relaxed">
            <p className="mb-3"><strong>Pattern Matching:</strong> Find all employees whose names start with the letter 'A'.</p>
            <p className="mb-3"><strong>Subqueries:</strong> Calculate the average salary across the entire company dynamically, and use that result to filter high-earning employees.</p>
            <p><strong>EXISTS:</strong> Find all departments that have at least one active employee assigned to them without doing a full JOIN.</p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button onClick={runLike} className="btn-action bg-purple-600 hover:bg-purple-500 flex justify-between items-center">
              <span>1. Pattern Matching</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">LIKE 'A%'</code>
            </button>
            <button onClick={runSubquery} className="btn-action bg-fuchsia-600 hover:bg-fuchsia-500 flex justify-between items-center">
              <span>2. Subquery (Compare to Avg)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">WHERE salary &gt; (SELECT...)</code>
            </button>
            <button onClick={runExists} className="btn-action bg-pink-600 hover:bg-pink-500 flex justify-between items-center">
              <span>3. EXISTS Operator</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">WHERE EXISTS(...)</code>
            </button>
          </div>
        </div>

        <SqlTerminal history={history} title="SQL Engine" statusColor="bg-purple-500" onRun={handleRun} />
      </div>
    </div>
  );
}
