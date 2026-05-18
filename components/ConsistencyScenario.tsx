import { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';

interface ConsistencyScenarioProps {
  history: HistoryItem[];
  onRunCommand: (query: string) => void;
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function ConsistencyScenario({ history, onRunCommand, executeSilentQuery }: ConsistencyScenarioProps) {
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

  const attemptOverdraft = () => {
    onRunCommand(`UPDATE BankAccounts SET balance = balance - 5000 WHERE id = 1;`);
  };

  const attemptBadForeignKey = () => {
    onRunCommand(`INSERT INTO Transfers (from_account, to_account, amount) VALUES (1, 999, 50);`);
  };

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">CONSISTENCY SCENARIO: ENFORCING RULES</h3>
        <p className="scenario-desc">
          The database enforces system rules (Constraints) before writing any data. If a transaction violates a CHECK or FOREIGN KEY constraint, it is immediately rejected.
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

          <div className="mt-auto pt-6 flex flex-col gap-3">
            <button onClick={attemptOverdraft} className="btn-action bg-orange-600 hover:bg-orange-500">
              Violate CHECK Constraint (Alice overdrafts $5000)
            </button>
            <button onClick={attemptBadForeignKey} className="btn-action bg-orange-600 hover:bg-orange-500">
              Violate FOREIGN KEY (Transfer to Account ID 999)
            </button>
          </div>
        </div>

        {/* Terminal Panel */}
        <SqlTerminal history={history} title="Session A (Writer)" statusColor="bg-emerald-500" onRun={onRunCommand} />
      </div>
    </div>
  );
}
