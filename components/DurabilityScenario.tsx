import { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { Zap } from 'lucide-react';
import { QueryExecResult } from 'sql.js';

interface DurabilityScenarioProps {
  history: HistoryItem[];
  onRunCommand: (query: string) => void;
  onCrash: () => void;
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function DurabilityScenario({ history, onRunCommand, onCrash, executeSilentQuery }: DurabilityScenarioProps) {
  const [aliceBalance, setAliceBalance] = useState<number | string>('...');
  const [hasUncommitted, setHasUncommitted] = useState(false);

  useEffect(() => {
    const { results, error } = executeSilentQuery("SELECT balance FROM BankAccounts WHERE owner_name = 'Alice'");
    if (!error && results.length > 0) {
      setAliceBalance(results[0].values[0][0] as number);
    }
  }, [history, executeSilentQuery]);

  const simulateOpenTransaction = () => {
    onRunCommand(`START TRANSACTION;\nUPDATE BankAccounts SET balance = 99999 WHERE owner_name = 'Alice';`);
    setHasUncommitted(true);
  };

  const handleCrash = () => {
    onCrash();
    setHasUncommitted(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="scenario-card border-red-900/30">
        <h3 className="scenario-title text-red-400">DURABILITY SCENARIO: SYSTEM CRASH</h3>
        <p className="scenario-desc">
          Durability guarantees that committed data survives system crashes. Any uncommitted data resting in RAM is destroyed upon restart, and the system restores to the last committed state on disk.
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        {/* Live State Panel */}
        <div className="live-state-panel">
          <div className="live-state-header">Active Accounts state:</div>
          
          <div className="live-state-row border-indigo-900/50">
            <span className="text-slate-300">Alice In-Memory Balance:</span>
            <span className="font-bold font-mono text-indigo-400">${aliceBalance}</span>
          </div>

          <div className="mt-auto pt-6 flex flex-col gap-3">
            <button 
              onClick={simulateOpenTransaction} 
              disabled={hasUncommitted}
              className={`btn-action ${hasUncommitted ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'btn-purple'}`}
            >
              1. Open Transaction (Do NOT Commit)
            </button>
            <button 
              onClick={handleCrash} 
              disabled={!hasUncommitted}
              className={`btn-action flex items-center justify-center gap-2 ${hasUncommitted ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] text-white' : 'bg-slate-800 cursor-not-allowed text-slate-600'}`}
            >
              <Zap size={18} /> 2. Simulate System Crash
            </button>
          </div>
        </div>

        {/* Terminal Panel */}
        <SqlTerminal history={history} title="System Logs" statusColor="bg-red-500" onRun={onRunCommand} />
      </div>
    </div>
  );
}
