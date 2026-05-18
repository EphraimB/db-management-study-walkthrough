import { useState } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { SqlJsStatic } from 'sql.js';

interface IsolationScenarioProps {
  historyA: HistoryItem[];
  onRunCommandA: (query: string) => void;
  SQLStatic: SqlJsStatic | null;
  savedDiskState: Uint8Array | null;
}

export default function IsolationScenario({ historyA, onRunCommandA, SQLStatic, savedDiskState }: IsolationScenarioProps) {
  const [historyB, setHistoryB] = useState<HistoryItem[]>([]);
  const [step, setStep] = useState(0);

  const runSessionBQuery = (query: string) => {
    if (!SQLStatic || !savedDiskState) return;
    
    // Instantiate a fresh DB from the LAST COMMITTED disk state
    // This physically prevents Session B from seeing Session A's uncommitted memory!
    const dbB = new SQLStatic.Database(savedDiskState);
    try {
      const results = dbB.exec(query);
      setHistoryB(prev => [...prev, {
        id: Date.now(),
        query,
        results,
        error: null,
      }]);
    } catch (err: any) {
      setHistoryB(prev => [...prev, {
        id: Date.now(),
        query,
        results: null,
        error: err.message,
      }]);
    } finally {
      dbB.close();
    }
  };

  const handleStep1 = () => {
    onRunCommandA("START TRANSACTION;\nUPDATE BankAccounts SET balance = 0 WHERE owner_name = 'Alice';");
    setStep(1);
  };

  const handleStep2 = () => {
    runSessionBQuery("SELECT balance FROM BankAccounts WHERE owner_name = 'Alice';");
    setStep(2);
  };

  const handleStep3 = () => {
    onRunCommandA("COMMIT;");
    setStep(3);
  };

  const handleStep4 = () => {
    runSessionBQuery("SELECT balance FROM BankAccounts WHERE owner_name = 'Alice';");
    setStep(4);
  };

  return (
    <div className="animate-fade-in">
      <div className="scenario-card">
        <h3 className="scenario-title">ISOLATION SCENARIO: CONCURRENT SESSIONS</h3>
        <p className="scenario-desc">
          Under a standard <strong>Read Committed</strong> isolation level, Session B (Reader) is completely isolated from Session A's active changes until Session A executes a formal <code>COMMIT</code> statement. This blocks dirty reads.
        </p>
      </div>

      <div className="panel-container md:grid-cols-2">
        {/* Terminal A */}
        <SqlTerminal history={historyA} title="Session A (Writer)" statusColor="bg-emerald-500" onRun={onRunCommandA} />
        
        {/* Terminal B */}
        <SqlTerminal history={historyB} title="Session B (Reader)" statusColor="bg-amber-500" onRun={runSessionBQuery} />
      </div>

      <div className="flex gap-3 justify-center mt-4">
        {step === 0 && (
          <button onClick={handleStep1} className="btn-action btn-purple">
            Step 1: Start Transaction (Session A)
          </button>
        )}
        {step === 1 && (
          <button onClick={handleStep2} className="btn-action bg-amber-600 hover:bg-amber-500">
            Step 2: Read Balance (Session B)
          </button>
        )}
        {step === 2 && (
          <button onClick={handleStep3} className="btn-action btn-green">
            Step 3: Commit Transaction (Session A)
          </button>
        )}
        {step === 3 && (
          <button onClick={handleStep4} className="btn-action bg-amber-600 hover:bg-amber-500">
            Step 4: Read Balance Again (Session B)
          </button>
        )}
        {step === 4 && (
          <div className="text-emerald-400 font-bold bg-emerald-900/30 px-6 py-2 rounded-full border border-emerald-500/50">
            Isolation Successfully Demonstrated!
          </div>
        )}
      </div>
    </div>
  );
}
