import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Zap, AlertTriangle, Search, FastForward, Activity } from 'lucide-react';

interface IndexingSuiteProps {
  executeQuery: (query: string) => any;
  executeSilentQuery: (query: string) => any;
}

type ScenarioId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

export default function IndexingSuite({ executeQuery, executeSilentQuery }: IndexingSuiteProps) {
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('S1');
  
  // Results State
  const [badTime, setBadTime] = useState<number | null>(null);
  const [badPlan, setBadPlan] = useState<any[][]>([]);
  const [goodTime, setGoodTime] = useState<number | null>(null);
  const [goodPlan, setGoodPlan] = useState<any[][]>([]);

  const generateData = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Create Base Table
      executeSilentQuery(`DROP TABLE IF EXISTS Idx_Demo;`);
      executeSilentQuery(`
        CREATE TABLE Idx_Demo (
          id INTEGER PRIMARY KEY,
          name TEXT,
          timestamp DATETIME,
          status TEXT,
          email TEXT,
          sku TEXT,
          customer_id INTEGER,
          total REAL
        );
      `);

      // Inject 50k rows
      executeSilentQuery(`
        WITH RECURSIVE cnt(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM cnt WHERE x < 50000)
        INSERT INTO Idx_Demo (id, name, timestamp, status, email, sku, customer_id, total) 
        SELECT 
          x, 
          'User_' || x, 
          datetime('now', '-' || (x % 1000) || ' days'), 
          CASE WHEN x % 100 = 0 THEN 'inactive' ELSE 'active' END, 
          'user_' || x || '@demo.com', 
          'SKU-' || (x % 500) || '-' || x, 
          x % 1000, 
          (x % 500) * 1.5 
        FROM cnt;
      `);

      // Create All Indexes needed for demos
      executeSilentQuery(`CREATE INDEX idx_demo_name ON Idx_Demo(name);`);
      executeSilentQuery(`CREATE INDEX idx_demo_ts ON Idx_Demo(timestamp);`);
      executeSilentQuery(`CREATE INDEX idx_demo_bad_multi ON Idx_Demo(status, email);`);
      executeSilentQuery(`CREATE INDEX idx_demo_good_multi ON Idx_Demo(email, status);`);
      executeSilentQuery(`CREATE INDEX idx_demo_sku ON Idx_Demo(sku);`);
      executeSilentQuery(`CREATE INDEX idx_demo_cov ON Idx_Demo(customer_id, total);`);

      setIsGenerating(false);
      setIsGenerated(true);
    }, 100);
  };

  const resetResults = () => {
    setBadTime(null);
    setBadPlan([]);
    setGoodTime(null);
    setGoodPlan([]);
  };

  const switchScenario = (id: ScenarioId) => {
    setActiveScenario(id);
    resetResults();
  };

  const runQuery = (type: 'bad' | 'good', query: string) => {
    const start = performance.now();
    executeSilentQuery(query);
    const end = performance.now();
    
    const plan = executeSilentQuery(`EXPLAIN QUERY PLAN ${query}`);
    
    if (type === 'bad') {
      setBadTime(end - start);
      setBadPlan(plan.results[0]?.values || []);
    } else {
      setGoodTime(end - start);
      setGoodPlan(plan.results[0]?.values || []);
    }
  };

  const scenarios: Record<ScenarioId, { title: string; icon: any; badTitle: string; badDesc: string; badQuery: string; goodTitle: string; goodDesc: string; goodQuery: string }> = {
    'S1': {
      title: '1. Function Wrap Trap',
      icon: <AlertTriangle size={18} />,
      badTitle: 'Wrapping the Indexed Column',
      badDesc: 'Applying a function like UPPER() to an indexed column disables the B-Tree index, forcing a full table scan.',
      badQuery: `SELECT * FROM Idx_Demo WHERE UPPER(name) = 'USER_45000';`,
      goodTitle: 'Comparing the Raw Column',
      goodDesc: 'Leave the indexed column alone! Transform the input parameter instead so the index can be used.',
      goodQuery: `SELECT * FROM Idx_Demo WHERE name = 'User_45000';` // Assuming we transformed the input
    },
    'S2': {
      title: '2. Indexed Top-N',
      icon: <FastForward size={18} />,
      badTitle: 'Sorting Without an Index',
      badDesc: 'If we ORDER BY an unindexed column, SQLite must read all rows into memory and construct a temporary B-Tree just to sort them.',
      badQuery: `SELECT * FROM Idx_Demo ORDER BY total DESC LIMIT 10;`,
      goodTitle: 'Sorting WITH an Index',
      goodDesc: 'If we ORDER BY an indexed column, the data is already sorted in the B-Tree! SQLite just plucks the top 10.',
      goodQuery: `SELECT * FROM Idx_Demo ORDER BY timestamp DESC LIMIT 10;`
    },
    'S3': {
      title: '3. Multi-Column Selectivity',
      icon: <Search size={18} />,
      badTitle: 'Low Selectivity First (status, email)',
      badDesc: '99% of users are "active". If our index starts with status, the database still has to scan 49,500 rows to find the email!',
      badQuery: `SELECT * FROM Idx_Demo INDEXED BY idx_demo_bad_multi WHERE status = 'active' AND email = 'user_45000@demo.com';`,
      goodTitle: 'High Selectivity First (email, status)',
      goodDesc: 'Email is unique! If our index starts with email, the database instantly narrows it down to 1 row, then checks the status.',
      goodQuery: `SELECT * FROM Idx_Demo INDEXED BY idx_demo_good_multi WHERE email = 'user_45000@demo.com' AND status = 'active';`
    },
    'S4': {
      title: '4. LIKE Wildcards',
      icon: <AlertTriangle size={18} />,
      badTitle: 'Leading Wildcards (%abc)',
      badDesc: 'A B-Tree is like a dictionary. You cannot look up a word if you only know how it ends. A leading wildcard forces a full scan!',
      badQuery: `SELECT * FROM Idx_Demo WHERE sku LIKE '%-45000';`,
      goodTitle: 'Trailing Wildcards (abc%)',
      goodDesc: 'If you know how it starts, you can use the dictionary! Trailing wildcards successfully use the index.',
      goodQuery: `SELECT * FROM Idx_Demo WHERE sku LIKE 'SKU-0-%';`
    },
    'S5': {
      title: '5. Covering Indexes',
      icon: <Zap size={18} />,
      badTitle: 'Fetching Unindexed Columns',
      badDesc: 'The index finds the row pointer, but the database must still go to the main table on disk to fetch the "name" column.',
      badQuery: `SELECT name, total FROM Idx_Demo WHERE customer_id = 500;`,
      goodTitle: 'Index-Only Scan',
      goodDesc: 'Our index is on (customer_id, total). Since we only ask for total, the query is "covered". It NEVER visits the main table!',
      goodQuery: `SELECT total FROM Idx_Demo WHERE customer_id = 500;`
    }
  };

  const s = scenarios[activeScenario];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="bg-rose-600 text-white w-10 h-10 rounded-lg flex items-center justify-center"><Activity size={24}/></span>
            Indexing Anti-Patterns
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm">
            Creating an index is easy. Writing a query that actually <strong>uses</strong> that index is hard. Watch how common anti-patterns force the database to ignore your indexes!
          </p>
        </div>
      </div>

      {!isGenerated ? (
        <div className="scenario-card border-emerald-500/30 text-center py-12">
          <Zap size={48} className="mx-auto text-emerald-400 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">Prepare the Test Environment</h3>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            To see real performance differences, we need massive amounts of data. Click below to inject 50,000 highly-skewed rows and pre-compile 5 different indexes.
          </p>
          <button onClick={generateData} disabled={isGenerating} className="btn-action bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-lg px-8 py-3">
            {isGenerating ? 'Injecting 50k Rows...' : 'Initialize Test Database'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar Menu */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            {(Object.keys(scenarios) as ScenarioId[]).map((key) => (
              <button
                key={key}
                onClick={() => switchScenario(key)}
                className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 text-sm font-bold ${
                  activeScenario === key ? 'bg-slate-800 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                {scenarios[key].icon}
                {scenarios[key].title}
              </button>
            ))}
          </div>

          {/* Main Dashboard */}
          <div className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {s.icon} {s.title}
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BAD QUERY COLUMN */}
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold mb-2 uppercase tracking-wider text-xs">
                    <AlertTriangle size={14} /> The Anti-Pattern
                  </div>
                  <h4 className="text-white font-bold mb-1">{s.badTitle}</h4>
                  <p className="text-slate-400 text-xs mb-4 min-h-[48px]">{s.badDesc}</p>
                  
                  <div className="bg-black/40 border border-rose-900/50 p-3 rounded font-mono text-[11px] text-rose-200 mb-4 h-[80px] flex items-center">
                    {s.badQuery}
                  </div>

                  <button 
                    onClick={() => runQuery('bad', s.badQuery)}
                    className="w-full py-2 bg-rose-900/50 hover:bg-rose-800/80 text-rose-200 rounded font-bold transition-colors border border-rose-700 mb-4"
                  >
                    Execute Bad Query
                  </button>

                  <div className="h-[120px] bg-slate-900 border border-slate-800 rounded p-3 flex flex-col justify-center relative overflow-hidden">
                    {badTime !== null ? (
                      <div className="animate-fade-in text-center relative z-10">
                        <div className="text-3xl font-bold text-rose-400 mb-1">{badTime.toFixed(2)} ms</div>
                        <div className="text-xs text-rose-500/70 font-mono text-left bg-black/30 p-2 rounded max-h-[60px] overflow-y-auto">
                          {badPlan.map((p, i) => <div key={i}>{p[3]}</div>)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-600 text-sm italic">Waiting for execution...</div>
                    )}
                  </div>
                </div>

                {/* GOOD QUERY COLUMN */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 uppercase tracking-wider text-xs">
                    <CheckCircle2 size={14} /> The Optimized Way
                  </div>
                  <h4 className="text-white font-bold mb-1">{s.goodTitle}</h4>
                  <p className="text-slate-400 text-xs mb-4 min-h-[48px]">{s.goodDesc}</p>
                  
                  <div className="bg-black/40 border border-emerald-900/50 p-3 rounded font-mono text-[11px] text-emerald-200 mb-4 h-[80px] flex items-center">
                    {s.goodQuery}
                  </div>

                  <button 
                    onClick={() => runQuery('good', s.goodQuery)}
                    className="w-full py-2 bg-emerald-900/50 hover:bg-emerald-800/80 text-emerald-200 rounded font-bold transition-colors border border-emerald-700 mb-4"
                  >
                    Execute Optimized Query
                  </button>

                  <div className="h-[120px] bg-slate-900 border border-slate-800 rounded p-3 flex flex-col justify-center relative overflow-hidden">
                    {goodTime !== null ? (
                      <div className="animate-fade-in text-center relative z-10">
                        <div className="text-3xl font-bold text-emerald-400 mb-1">{goodTime.toFixed(2)} ms</div>
                        <div className="text-xs text-emerald-500/70 font-mono text-left bg-black/30 p-2 rounded max-h-[60px] overflow-y-auto">
                          {goodPlan.map((p, i) => <div key={i}>{p[3]}</div>)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-600 text-sm italic">Waiting for execution...</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Speedup Metric */}
              {badTime !== null && goodTime !== null && goodTime > 0 && (
                <div className="mt-6 bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-lg text-center animate-fade-in">
                  <span className="text-indigo-300 font-bold text-lg">
                    The optimized query was <span className="text-indigo-400 text-2xl mx-1">{(badTime / goodTime).toFixed(1)}x</span> faster!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
