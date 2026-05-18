import { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface RaSelectProjectProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function RaSelectProject({ executeQuery, executeSilentQuery }: RaSelectProjectProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [employeesData, setEmployeesData] = useState<any[][]>([]);
  const [empCols, setEmpCols] = useState<string[]>([]);

  useEffect(() => {
    const { results, error } = executeSilentQuery("SELECT * FROM Employees");
    if (!error && results.length > 0) {
      setEmpCols(results[0].columns);
      setEmployeesData(results[0].values);
    }
  }, [executeSilentQuery]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const runSelection = () => handleRun("SELECT * FROM Employees WHERE salary > 60000;");
  const runProjection = () => handleRun("SELECT emp_name, salary FROM Employees;");
  const runComposition = () => handleRun("SELECT emp_name FROM Employees WHERE department_id = 1;");

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">SELECT (σ) & PROJECT (π)</h3>
        <p className="scenario-desc">
          <strong>Selection (σ)</strong> filters rows that meet a condition (the SQL <code>WHERE</code> clause). <br/>
          <strong>Projection (π)</strong> filters columns to return only specific attributes (the SQL <code>SELECT</code> clause).
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        {/* Live State Panel */}
        <div className="live-state-panel">
          <div className="live-state-header text-indigo-300">Base Relation: Employees</div>
          
          <div className="overflow-x-auto border border-slate-700 rounded mb-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800">
                  {empCols.map((c, i) => <th key={i} className="px-3 py-2 border-b border-slate-700 text-slate-300">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {employeesData.map((row, i) => (
                  <tr key={i} className="bg-[#0b0f19] hover:bg-slate-800/50 transition-colors">
                    {row.map((val, j) => <td key={j} className="px-3 py-2 border-b border-slate-800/50 text-slate-400">{val !== null ? String(val) : <span className="text-slate-600 italic">NULL</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button onClick={runSelection} className="btn-action bg-indigo-600 hover:bg-indigo-500 flex justify-between items-center">
              <span>1. Selection (Filter Rows)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">σ salary &gt; 60k (Employees)</code>
            </button>
            <button onClick={runProjection} className="btn-action bg-purple-600 hover:bg-purple-500 flex justify-between items-center">
              <span>2. Projection (Filter Cols)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">π emp_name, salary (Employees)</code>
            </button>
            <button onClick={runComposition} className="btn-action bg-emerald-600 hover:bg-emerald-500 flex justify-between items-center">
              <span>3. Composition (Both)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">π emp_name (σ dept=1 (Employees))</code>
            </button>
          </div>
        </div>

        {/* Terminal Panel */}
        <SqlTerminal history={history} title="SQL Engine" statusColor="bg-emerald-500" onRun={handleRun} />
      </div>
    </div>
  );
}
