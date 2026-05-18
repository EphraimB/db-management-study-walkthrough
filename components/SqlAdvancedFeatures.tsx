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

  const runCreateProc = () => handleRun("DELIMITER //\nCREATE PROCEDURE GetEarnersAbove(IN min_salary DECIMAL)\nBEGIN\n  SELECT emp_name, salary FROM Employees WHERE salary > min_salary;\nEND //\nDELIMITER ;");
  const runCallProc = () => handleRun("CALL GetEarnersAbove(80000);");
  const runCaseStatement = () => handleRun("SELECT emp_name, salary,\nCASE\n  WHEN salary > 80000 THEN 'High Earner'\n  WHEN salary > 60000 THEN 'Mid Earner'\n  ELSE 'Entry Level'\nEND as compensation_tier\nFROM Employees;");

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">STORED PROCEDURES & CASE STATEMENTS</h3>
        <p className="scenario-desc">
          <strong>Stored Procedures:</strong> Saved SQL scripts that accept input parameters (<code>IN</code>/<code>OUT</code>) and execute complex logic. <br/>
          <strong>Case Statements:</strong> SQL's version of <code>IF/ELSE</code> logic, used to return dynamically categorized data within a query.
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        <div className="live-state-panel">
          <div className="live-state-header text-cyan-400">Advanced Structures</div>
          
          <div className="text-sm text-slate-400 mb-6 flex-grow leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
            <p className="mb-3"><strong>Stored Procedures:</strong> Creates a reusable block of code with a dynamic <code>min_salary</code> parameter, and executes it via the <code>CALL</code> command.</p>
            <p><strong>Case Statements:</strong> Evaluates conditions sequentially. Once a condition is true, it stops reading and returns the result. If no conditions are true, it returns the value in the <code>ELSE</code> clause.</p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button onClick={runCreateProc} className="btn-action bg-blue-600 hover:bg-blue-500 flex justify-between items-center py-2">
              <span>1. Create Procedure</span>
              <code className="bg-black/30 px-2 py-1 rounded text-[10px] font-mono">DELIMITER //</code>
            </button>
            <button onClick={runCallProc} className="btn-action bg-indigo-600 hover:bg-indigo-500 flex justify-between items-center py-2">
              <span>2. Call Procedure</span>
              <code className="bg-black/30 px-2 py-1 rounded text-[10px] font-mono">CALL GetEarnersAbove(80k)</code>
            </button>
            <button onClick={runCaseStatement} className="btn-action bg-emerald-600 hover:bg-emerald-500 flex justify-between items-center py-2">
              <span>3. CASE Statement</span>
              <code className="bg-black/30 px-2 py-1 rounded text-[10px] font-mono">CASE WHEN ... THEN</code>
            </button>
          </div>
        </div>

        <SqlTerminal history={history} title="SQL Engine" statusColor="bg-cyan-500" onRun={handleRun} />
      </div>
    </div>
  );
}
