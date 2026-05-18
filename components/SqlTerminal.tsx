import { useState, useRef, useEffect } from 'react';
import { Play, TerminalSquare } from 'lucide-react';
import { QueryExecResult } from 'sql.js';

type HistoryItem = {
  id: number;
  query: string;
  results: QueryExecResult[] | null;
  error: string | null;
};

interface SqlTerminalProps {
  history: HistoryItem[];
  onRun: (query: string) => void;
  isReady: boolean;
}

export default function SqlTerminal({ history, onRun, isReady }: SqlTerminalProps) {
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleRun = () => {
    if (!isReady || !query.trim()) return;
    onRun(query);
    setQuery(''); // Clear input after run
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleRun();
    }
  };

  // Function to format errors to look more like MySQL
  const formatError = (err: string) => {
    if (err.includes('CHECK') || err.includes('constraint')) return `ERROR 3819 (HY000): Check constraint is violated.`;
    if (err.includes('FOREIGN KEY')) return `ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails.`;
    return `ERROR 1064 (42000): ${err}`;
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full animate-fade-in border border-white/20 shadow-2xl">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 text-orange-400">
        <TerminalSquare size={20} />
        <h2 className="text-xl font-bold font-mono">MySQL Terminal</h2>
      </div>
      
      {/* History Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto mb-4 space-y-4 font-mono text-sm pr-2 custom-scrollbar"
      >
        {history.length === 0 && (
          <div className="text-gray-500 italic">Connected to MySQL simulation. Ready for commands...</div>
        )}
        
        {history.map(item => (
          <div key={item.id} className="bg-black/30 p-3 rounded-md border border-white/5">
            <div className="text-blue-300 font-bold mb-2 break-words whitespace-pre-wrap">
              mysql&gt; {item.query}
            </div>
            
            {item.error ? (
              <div className="text-red-400 bg-red-950/40 p-2 rounded border border-red-900/50 whitespace-pre-wrap">
                {formatError(item.error)}
              </div>
            ) : item.results && item.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="sql-table min-w-full text-left">
                  <thead>
                    <tr>
                      {item.results[0].columns.map((col, i) => (
                        <th key={i} className="px-2 py-1 bg-white/10 text-orange-200 border border-white/20">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.results[0].values.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-white/10">
                        {row.map((val, colIndex) => (
                          <td key={colIndex} className="px-2 py-1 text-gray-200 border border-white/10">
                            {val !== null ? String(val) : <span className="italic text-gray-500">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-400 italic">
                {item.query === '-- SYSTEM EVENT --' ? '' : 'Query OK, 0 rows affected.'}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Input Area */}
      <div className="mt-auto shrink-0 flex flex-col gap-2 pt-2 border-t border-white/10">
        <textarea
          className="sql-input min-h-[80px] max-h-[200px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter MySQL... (Ctrl+Enter to run)"
        />
        <button 
          className="btn-primary self-end py-1.5 px-4"
          onClick={handleRun}
          disabled={!isReady || !query.trim()}
        >
          <Play size={16} />
          {isReady ? 'Run' : 'Wait...'}
        </button>
      </div>
    </div>
  );
}
