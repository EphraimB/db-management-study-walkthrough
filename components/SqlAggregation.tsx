import { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface SqlAggregationProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function SqlAggregation({ executeQuery, executeSilentQuery }: SqlAggregationProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [salesData, setSalesData] = useState<any[][]>([]);
  const [salesCols, setSalesCols] = useState<string[]>([]);

  useEffect(() => {
    const { results, error } = executeSilentQuery("SELECT * FROM Sales");
    if (!error && results.length > 0) {
      setSalesCols(results[0].columns);
      setSalesData(results[0].values);
    }
  }, [executeSilentQuery]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const runBasicAgg = () => handleRun("SELECT COUNT(*) as total_sales, SUM(amount) as total_revenue, AVG(amount) as avg_sale\nFROM Sales;");
  const runGroupBy = () => handleRun("SELECT e.emp_name, SUM(s.amount) as total_sold\nFROM Sales s\nJOIN Employees e ON s.employee_id = e.id\nGROUP BY e.emp_name;");
  const runHaving = () => handleRun("SELECT e.emp_name, SUM(s.amount) as total_sold\nFROM Sales s\nJOIN Employees e ON s.employee_id = e.id\nGROUP BY e.emp_name\nHAVING SUM(s.amount) > 2000;");

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">AGGREGATION & GROUPING</h3>
        <p className="scenario-desc">
          <strong>Aggregation</strong> functions like <code>SUM()</code>, <code>AVG()</code>, and <code>COUNT()</code> perform a calculation on a set of values.<br/>
          <strong>GROUP BY</strong> groups rows that have the same values into summary rows.<br/>
          <strong>HAVING</strong> filters records <em>after</em> the grouping has occurred (unlike <code>WHERE</code> which filters before).
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        <div className="live-state-panel">
          <div className="live-state-header text-amber-400">Base Relation: Sales</div>
          
          <div className="overflow-x-auto border border-slate-700 rounded mb-4 max-h-[200px] custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800">
                  {salesCols.map((c, i) => <th key={i} className="px-3 py-2 border-b border-slate-700 text-slate-300 sticky top-0 bg-slate-800">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {salesData.map((row, i) => (
                  <tr key={i} className="bg-[#0b0f19] hover:bg-slate-800/50 transition-colors">
                    {row.map((val, j) => <td key={j} className="px-3 py-2 border-b border-slate-800/50 text-slate-400">{String(val)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button onClick={runBasicAgg} className="btn-action bg-amber-600 hover:bg-amber-500 flex flex-col items-start gap-1">
              <span className="font-bold">1. Basic Aggregation</span>
              <span className="text-xs text-amber-200">Find total count, sum, and average of all sales.</span>
            </button>
            <button onClick={runGroupBy} className="btn-action bg-orange-600 hover:bg-orange-500 flex flex-col items-start gap-1">
              <span className="font-bold">2. GROUP BY</span>
              <span className="text-xs text-orange-200">Calculate total sales per employee.</span>
            </button>
            <button onClick={runHaving} className="btn-action bg-red-600 hover:bg-red-500 flex flex-col items-start gap-1">
              <span className="font-bold">3. HAVING (Filter Groups)</span>
              <span className="text-xs text-red-200">Find employees with total sales &gt; $2,000.</span>
            </button>
          </div>
        </div>

        <SqlTerminal history={history} title="SQL Engine" statusColor="bg-amber-500" onRun={handleRun} />
      </div>
    </div>
  );
}
