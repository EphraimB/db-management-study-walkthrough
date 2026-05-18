import { useState } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface SqlAdvancedFeaturesProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function SqlAdvancedFeatures({ executeQuery, executeSilentQuery }: SqlAdvancedFeaturesProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const runCTE = () => handleRun("WITH DeptTotals AS (\n  SELECT department_id, SUM(salary) as total_sal\n  FROM Employees\n  GROUP BY department_id\n)\nSELECT d.dept_name, dt.total_sal\nFROM Departments d\nJOIN DeptTotals dt ON d.id = dt.department_id;");
  const runCreateView = () => handleRun("CREATE VIEW HighEarners AS\nSELECT emp_name, salary \nFROM Employees \nWHERE salary > 70000;");
  const runSelectView = () => handleRun("SELECT * FROM HighEarners;");

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">CTEs & VIEWS</h3>
        <p className="scenario-desc">
          <strong>CTEs (Common Table Expressions):</strong> Temporary result sets defined using the <code>WITH</code> clause. Excellent for breaking down complex queries.<br/>
          <strong>Views:</strong> Saved, permanent queries that act like virtual tables in the database. Good for security and reusability.
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        <div className="live-state-panel">
          <div className="live-state-header text-cyan-400">Advanced Structures</div>
          
          <div className="text-sm text-slate-400 mb-6 flex-grow leading-relaxed">
            <p className="mb-3"><strong>CTE:</strong> We will first create a temporary block calculating total salaries per department, and then immediately query against that block in a single statement.</p>
            <p className="mb-3"><strong>View Creation:</strong> We will create a permanent virtual table called <code>HighEarners</code>. Notice it returns 0 rows initially, but succeeds.</p>
            <p><strong>Query View:</strong> Once the view is created, we can query it exactly as if it were a physical table.</p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button onClick={runCTE} className="btn-action bg-cyan-600 hover:bg-cyan-500 flex justify-between items-center">
              <span>1. Execute CTE</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">WITH cte_name AS (...)</code>
            </button>
            <button onClick={runCreateView} className="btn-action bg-teal-600 hover:bg-teal-500 flex justify-between items-center">
              <span>2. Create View</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">CREATE VIEW</code>
            </button>
            <button onClick={runSelectView} className="btn-action bg-emerald-600 hover:bg-emerald-500 flex justify-between items-center">
              <span>3. Query the View</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">SELECT * FROM View</code>
            </button>
          </div>
        </div>

        <SqlTerminal history={history} title="SQL Engine" statusColor="bg-cyan-500" onRun={handleRun} />
      </div>
    </div>
  );
}
