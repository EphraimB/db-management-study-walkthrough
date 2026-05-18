import { useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, CheckCircle, Play, Zap } from 'lucide-react';

interface Step {
  id: number;
  letter: string;
  title: string;
  content: React.ReactNode;
  suggestedQuery?: string;
  action?: 'crash';
}

const STEPS: Step[] = [
  {
    id: 1,
    letter: "A",
    title: "Atomicity: The Successful Commit",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300"><strong>Atomicity</strong> ensures that a transaction is treated as a single, indivisible unit. It all succeeds, or none of it succeeds.</p>
        <p className="text-gray-300">Let's do a successful transfer of $100 from Alice (Account 1) to Bob (Account 2). Notice that both accounts update successfully when COMMITTED.</p>
      </div>
    ),
    suggestedQuery: "BEGIN;\nUPDATE BankAccounts SET balance = balance - 100 WHERE id = 1;\nUPDATE BankAccounts SET balance = balance + 100 WHERE id = 2;\nINSERT INTO Transfers (from_account, to_account, amount) VALUES (1, 2, 100);\nCOMMIT;\n\nSELECT * FROM BankAccounts;"
  },
  {
    id: 2,
    letter: "A",
    title: "Atomicity: The Rollback",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">Now let's simulate a failure. You start transferring money, but realize the amount is wrong halfway through.</p>
        <p className="text-gray-300">The <code>ROLLBACK</code> command undoes everything automatically. Check the balances—they reverted!</p>
      </div>
    ),
    suggestedQuery: "BEGIN;\nUPDATE BankAccounts SET balance = balance - 500 WHERE id = 1;\n-- Oh wait, wrong amount!\nROLLBACK;\nSELECT * FROM BankAccounts;"
  },
  {
    id: 3,
    letter: "C",
    title: "Consistency: Constraints",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300"><strong>Consistency</strong> ensures data must meet all validation rules before being written.</p>
        <p className="text-gray-300">Our <code>BankAccounts</code> table has a <code>CHECK (balance &gt;= 0)</code> constraint. Watch what happens when we try to overdraft Bob's account into the negative.</p>
      </div>
    ),
    suggestedQuery: "UPDATE BankAccounts SET balance = balance - 1000 WHERE id = 2;"
  },
  {
    id: 4,
    letter: "C",
    title: "Consistency: Foreign Keys",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">Let's try to create a transfer to an account ID that doesn't exist (Account 999). The database's <strong>Foreign Key</strong> constraint will immediately block this.</p>
      </div>
    ),
    suggestedQuery: "INSERT INTO Transfers (from_account, to_account, amount) VALUES (1, 999, 50);"
  },
  {
    id: 5,
    letter: "I",
    title: "Isolation: Open Transactions",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300"><strong>Isolation</strong> means concurrent transactions don't interfere. When you <code>BEGIN</code> a transaction, the DB locks to prevent others from reading uncommitted chaos.</p>
        <p className="text-gray-300">Let's open a transaction and modify Alice's balance to 0, but <strong>leave it open</strong> (no COMMIT).</p>
      </div>
    ),
    suggestedQuery: "BEGIN;\nUPDATE BankAccounts SET balance = 0 WHERE id = 1;\nSELECT * FROM BankAccounts;"
  },
  {
    id: 6,
    letter: "D",
    title: "Durability: The System Crash",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300"><strong>Durability</strong> guarantees that committed data survives system crashes. But wait! You left the transaction open in the previous step.</p>
        <p className="text-gray-300">If the server crashes right now, your uncommitted changes (where Alice has $0) will be lost, and the DB will restore to the last safely committed state.</p>
      </div>
    ),
    action: 'crash'
  },
  {
    id: 7,
    letter: "D",
    title: "Durability: The Aftermath",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">The server has rebooted. Run a select to verify that Alice's balance reverted to what it was before the uncommitted transaction!</p>
      </div>
    ),
    suggestedQuery: "SELECT * FROM BankAccounts;"
  }
];

interface WalkthroughProps {
  onRunCommand: (query: string) => void;
  inTransaction: boolean;
  onCrash: () => void;
}

export default function Walkthrough({ onRunCommand, inTransaction, onCrash }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-full animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-blue-500 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-1 mb-6 mt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">ACID Concept: {step.letter}</span>
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-blue-400 shrink-0" />
          <h2 className="text-xl font-bold text-white leading-tight">{step.title}</h2>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
        {step.content}
        
        {step.suggestedQuery && (
          <div className="mt-6 p-4 rounded-lg border bg-blue-900/10 border-blue-500/30">
            <h4 className="text-blue-300 text-sm font-semibold mb-2">Example Query:</h4>
            <pre className="text-xs text-gray-300 bg-black/50 p-3 rounded font-mono mb-4 overflow-x-auto">
              {step.suggestedQuery}
            </pre>
            <button 
              onClick={() => onRunCommand(step.suggestedQuery!)}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              <Play size={16} /> Execute Example Automatically
            </button>
          </div>
        )}

        {step.action === 'crash' && (
          <button 
            onClick={onCrash}
            className="mt-6 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
          >
            <Zap size={20} /> SIMULATE SERVER CRASH
          </button>
        )}
        
        {inTransaction && (
          <div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded text-yellow-200 text-xs font-mono flex items-center justify-center">
            ⚠️ TRANSACTION CURRENTLY OPEN ⚠️
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/10 shrink-0">
        <button 
          className="btn-secondary text-sm px-4 py-2"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        
        {currentStep === STEPS.length - 1 ? (
          <button className="btn-primary bg-gradient-to-r from-green-600 to-emerald-500" onClick={() => alert("Simulation Complete! You've mastered ACID.")}>
            <CheckCircle size={18} /> Finish
          </button>
        ) : (
          <button className="btn-primary text-sm px-4 py-2" onClick={handleNext}>
            Next Step <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
