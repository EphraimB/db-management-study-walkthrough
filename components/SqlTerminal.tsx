import { useRef, useEffect, useState } from 'react';
import { QueryExecResult } from 'sql.js';

export type HistoryItem = {
  id: number;
  query: string;
  results: QueryExecResult[] | null;
  error: string | null;
  affectedRows?: number;
};

interface SqlTerminalProps {
  history: HistoryItem[];
  title?: string;
  statusColor?: string;
  onRun?: (query: string) => void;
}

export default function SqlTerminal({ history, title = "mysql>", statusColor = "bg-emerald-500", onRun }: SqlTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Function to format errors to look more like MySQL
  const formatError = (err: string) => {
    if (err.includes('CHECK') || err.includes('constraint')) return `ERROR 3819 (HY000): Check constraint is violated.`;
    if (err.includes('FOREIGN KEY')) return `ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails.`;
    return `ERROR 1064 (42000): ${err}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() && onRun) {
      onRun(input);
      setInput('');
    }
  };

  return (
    <div className="terminal-panel h-full min-h-[300px] flex flex-col">
      <div className="terminal-header">
        <div className="terminal-title">
          {title}
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow-[0_0_8px_currentColor] opacity-80`} />
      </div>
      
      <div ref={scrollRef} className="terminal-body custom-scrollbar space-y-4">
        {history.length === 0 && (
          <div className="text-slate-600 italic">Waiting for queries...</div>
        )}
        
        {history.map(item => (
          <div key={item.id} className="break-words">
            <div className="text-slate-100 whitespace-pre-wrap">
              mysql&gt; {item.query}
            </div>
            
            {item.error ? (
              <div className="text-red-400 whitespace-pre-wrap">
                {formatError(item.error)}
              </div>
            ) : item.results && item.results.length > 0 ? (
              <div className="overflow-x-auto mt-2 mb-1">
                <table className="min-w-max text-left border-collapse">
                  <thead>
                    <tr>
                      {item.results[0].columns.map((col, i) => (
                        <th key={i} className="px-3 py-1 bg-slate-800/50 text-slate-300 border border-slate-700">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.results[0].values.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((val, colIndex) => (
                          <td key={colIndex} className="px-3 py-1 text-slate-400 border border-slate-700">
                            {val !== null ? String(val) : <span className="italic text-slate-600">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-400 mt-1">
                {item.query === '-- SYSTEM EVENT --' ? '' : `Query OK, ${item.affectedRows ?? 0} row(s) affected.`}
              </div>
            )}
          </div>
        ))}
      </div>

      {onRun && (
        <div className="bg-[#05080f] px-4 py-3 border-t border-slate-800 flex items-center shrink-0">
          <span className="text-slate-500 font-mono text-xs mr-2">mysql&gt;</span>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-slate-300 font-mono text-xs focus:outline-none flex-grow placeholder-slate-700"
            placeholder="Type SQL command and press Enter..."
          />
        </div>
      )}
    </div>
  );
}
