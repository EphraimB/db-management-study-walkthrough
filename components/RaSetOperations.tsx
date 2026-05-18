import { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface RaSetOperationsProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function RaSetOperations({ executeQuery, executeSilentQuery }: RaSetOperationsProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deptsData, setDeptsData] = useState<any[][]>([]);
  const [empData, setEmpData] = useState<any[][]>([]);

  useEffect(() => {
    const resDept = executeSilentQuery("SELECT * FROM Departments");
    if (!resDept.error && resDept.results.length > 0) setDeptsData(resDept.results[0].values);

    const resEmp = executeSilentQuery("SELECT * FROM Employees");
    if (!resEmp.error && resEmp.results.length > 0) setEmpData(resEmp.results[0].values);
  }, [executeSilentQuery]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const runUnion = () => handleRun("SELECT emp_name AS name FROM Employees\nUNION\nSELECT dept_name AS name FROM Departments;");
  const runExcept = () => handleRun("SELECT id FROM Departments\nEXCEPT\nSELECT department_id FROM Employees;");
  const runCartesian = () => handleRun("SELECT * FROM Employees CROSS JOIN Departments;");

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">SET OPERATIONS (∪, -, ×)</h3>
        <p className="scenario-desc">
          <strong>Union (∪)</strong> combines tuples. <strong>Difference (-)</strong> finds tuples in relation A but not B (SQL <code>EXCEPT</code>). <br/>
          <strong>Cartesian Product (×)</strong> combines every tuple in A with every tuple in B (SQL <code>CROSS JOIN</code>).
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        <div className="live-state-panel">
          <div className="live-state-header text-amber-400">Relations</div>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1 overflow-hidden border border-slate-700 rounded">
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-800"><th className="px-2 py-1 border-b border-slate-700 text-slate-300">Departments</th></tr></thead>
                <tbody>
                  {deptsData.map((row, i) => (
                    <tr key={i} className="bg-[#0b0f19]"><td className="px-2 py-1 border-b border-slate-800/50 text-slate-400">{row[0]} | {row[1]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-1 overflow-hidden border border-slate-700 rounded">
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-800"><th className="px-2 py-1 border-b border-slate-700 text-slate-300">Employees (Ids)</th></tr></thead>
                <tbody>
                  {empData.map((row, i) => (
                    <tr key={i} className="bg-[#0b0f19]"><td className="px-2 py-1 border-b border-slate-800/50 text-slate-400">{row[0]} | {row[1]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button onClick={runUnion} className="btn-action bg-amber-600 hover:bg-amber-500 flex justify-between items-center">
              <span>1. Union (All Names)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">π name(E) ∪ π name(D)</code>
            </button>
            <button onClick={runExcept} className="btn-action bg-orange-600 hover:bg-orange-500 flex justify-between items-center">
              <span>2. Difference (Empty Depts)</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">π id(D) - π dept_id(E)</code>
            </button>
            <button onClick={runCartesian} className="btn-action bg-red-600 hover:bg-red-500 flex justify-between items-center">
              <span>3. Cartesian Product</span>
              <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono">Employees × Depts</code>
            </button>
          </div>
        </div>

        <SqlTerminal history={history} title="SQL Engine" statusColor="bg-amber-500" onRun={handleRun} />
      </div>
    </div>
  );
}
