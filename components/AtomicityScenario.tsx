import { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface AtomicityScenarioProps {
  history: HistoryItem[];
  onRunCommand: (query: string) => void;
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function AtomicityScenario({ history, onRunCommand, executeSilentQuery }: AtomicityScenarioProps) {
  const [aliceBalance, setAliceBalance] = useState<number | string>('...');
  const [bobBalance, setBobBalance] = useState<number | string>('...');

  useEffect(() => {
    const { results, error } = executeSilentQuery("SELECT owner_name, balance FROM BankAccounts WHERE id IN (1, 2)");
    if (!error && results.length > 0) {
      results[0].values.forEach(row => {
        if (row[0] === 'Alice') setAliceBalance(row[1] as number);
        if (row[0] === 'Bob') setBobBalance(row[1] as number);
      });
    }
  }, [history, executeSilentQuery]);

  const simulateSuccess = () => {
    onRunCommand(`START TRANSACTION;\nUPDATE BankAccounts SET balance = balance - 1000 WHERE id = 1;\nUPDATE BankAccounts SET balance = balance + 1000 WHERE id = 2;\nCOMMIT;`);
  };

  const simulateFailure = () => {
    onRunCommand(`START TRANSACTION;\nUPDATE BankAccounts SET balance = balance - 1000 WHERE id = 1;\n-- Network failure occurs before Bob's update!\nROLLBACK;`);
  };

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">ATOMICITY SCENARIO: FUNDS TRANSFER</h3>
        <p className="scenario-desc">
          Alice transfers $1000 to Bob. This requires two updates: (1) deduct from Alice, (2) add to Bob. Both must succeed, or both must roll back completely.
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        {/* Live State Panel */}
        <div className="live-state-panel">
          <div className="live-state-header">Active Accounts state:</div>
          
          <div className="live-state-row">
            <span className="text-slate-300">Alice Balance:</span>
            <span className="font-bold font-mono text-indigo-400">${aliceBalance}</span>
          </div>
          
          <div className="live-state-row">
            <span className="text-slate-300">Bob Balance:</span>
            <span className="font-bold font-mono text-indigo-400">${bobBalance}</span>
          </div>

          <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={simulateFailure} className="btn-action btn-red flex-1">
              Option A: Simulate Network Failure
            </button>
            <button onClick={simulateSuccess} className="btn-action btn-green flex-1">
              Option B: Both Updates Succeed
            </button>
          </div>
        </div>

        {/* Terminal Panel */}
        <SqlTerminal history={history} title="Session A (Writer)" statusColor="bg-emerald-500" onRun={onRunCommand} />
      </div>
    </div>
  );
}
