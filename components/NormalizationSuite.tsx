import { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface NormalizationSuiteProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function NormalizationSuite({ executeQuery, executeSilentQuery }: NormalizationSuiteProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [step, setStep] = useState(0); 
  const [animStep, setAnimStep] = useState(0); // Sub-steps for the BCNF closure animation
  
  const [tables, setTables] = useState<Record<string, { cols: string[], rows: any[][] }>>({});

  const refreshTables = (tableNames: string[]) => {
    const newTables: Record<string, { cols: string[], rows: any[][] }> = {};
    tableNames.forEach(tName => {
      const { results, error } = executeSilentQuery(`SELECT * FROM ${tName}`);
      if (!error && results.length > 0) {
        newTables[tName] = { cols: results[0].columns, rows: results[0].values };
      }
    });
    setTables(newTables);
  };

  useEffect(() => {
    if (step === 0) refreshTables(['UNF_StudentRecords']);
    else if (step === 1) refreshTables(['Norm1_StudentRecords']);
    else if (step === 2) refreshTables(['Norm2_Students', 'Norm2_Courses', 'Norm2_Enrollments']);
    else if (step === 3 || step === 4) refreshTables(['Norm3_Students', 'Norm3_Majors', 'Norm2_Courses', 'Norm2_Enrollments']);
    else if (step === 5) refreshTables(['Norm3_Students', 'Norm3_Majors', 'NormBC_Instructors', 'NormBC_Enrollments']);
  }, [step, executeSilentQuery]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const advanceTo1NF = () => {
    handleRun(`CREATE TABLE Norm1_StudentRecords (student_id INTEGER, student_name TEXT, major TEXT, advisor TEXT, course_id TEXT, course_name TEXT, instructor TEXT);\nINSERT INTO Norm1_StudentRecords VALUES \n(1, 'Alice', 'Computer Science', 'Dr. Smith', 'CS101', 'Intro to CS', 'Prof. Turing'),\n(1, 'Alice', 'Computer Science', 'Dr. Smith', 'MA101', 'Calculus I', 'Prof. Newton'),\n(2, 'Bob', 'Biology', 'Dr. Jones', 'BI101', 'Intro to Bio', 'Prof. Darwin'),\n(2, 'Bob', 'Biology', 'Dr. Jones', 'CS101', 'Intro to CS', 'Prof. Lovelace'),\n(3, 'Charlie', 'Computer Science', 'Dr. Smith', 'CS101', 'Intro to CS', 'Prof. Turing');`);
    setStep(1);
  };

  const advanceTo2NF = () => {
    handleRun(`CREATE TABLE Norm2_Students AS SELECT DISTINCT student_id, student_name, major, advisor FROM Norm1_StudentRecords;\nCREATE TABLE Norm2_Courses AS SELECT DISTINCT course_id, course_name FROM Norm1_StudentRecords;\nCREATE TABLE Norm2_Enrollments AS SELECT DISTINCT student_id, course_id, instructor FROM Norm1_StudentRecords;`);
    setStep(2);
  };

  const advanceTo3NF = () => {
    handleRun(`CREATE TABLE Norm3_Majors AS SELECT DISTINCT major, advisor FROM Norm2_Students;\nCREATE TABLE Norm3_Students AS SELECT DISTINCT student_id, student_name, major FROM Norm2_Students;`);
    setStep(3);
  };

  const advanceTo4NFAnimation = () => {
    setStep(4);
    setAnimStep(0);
  };

  const advanceToBCNF = () => {
    handleRun(`CREATE TABLE NormBC_Instructors AS SELECT DISTINCT instructor, course_id FROM Norm2_Enrollments;\nCREATE TABLE NormBC_Enrollments AS SELECT DISTINCT student_id, instructor FROM Norm2_Enrollments;`);
    setStep(5);
  };

  const renderTable = (name: string, keys?: Record<string, string[]>) => {
    const t = tables[name];
    if (!t) return null;
    return (
      <div className="mb-4">
        <h4 className="text-indigo-300 text-xs font-bold mb-1 uppercase tracking-wider">{name}</h4>
        <div className="overflow-x-auto border border-slate-700 rounded max-h-[200px] custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-800">
                {t.cols.map((c, i) => (
                  <th key={i} className="px-3 py-2 border-b border-slate-700 text-slate-300 sticky top-0 bg-slate-800">
                    {c}
                    {keys?.[c]?.includes('PK') && <span className="ml-1.5 inline-block bg-amber-500/20 text-amber-400 border border-amber-500/50 px-1 rounded text-[9px] font-bold">PK</span>}
                    {keys?.[c]?.includes('FK') && <span className="ml-1.5 inline-block bg-blue-500/20 text-blue-400 border border-blue-500/50 px-1 rounded text-[9px] font-bold">FK</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row, i) => (
                <tr key={i} className="bg-[#0b0f19] hover:bg-slate-800/50 transition-colors">
                  {row.map((val, j) => <td key={j} className="px-3 py-2 border-b border-slate-800/50 text-slate-400">{String(val)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-6">
        <h1 className="suite-header">Normalization & Dependencies</h1>
        <p className="suite-subtitle">Watch an unnormalized (UNF) table get mathematically decomposed into 3NF and BCNF to eliminate data anomalies.</p>
      </header>

      {/* Progress Steps UI */}
      <div className="flex items-center justify-between mb-8 px-4 relative max-w-3xl mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -z-10 -translate-y-1/2"></div>
        {[
          { s: 0, label: 'UNF' },
          { s: 1, label: '1NF' },
          { s: 2, label: '2NF' },
          { s: 3, label: '3NF' },
          { s: 4, label: 'FD Rule' },
          { s: 5, label: 'BCNF' }
        ].map(st => (
          <div key={st.s} className="flex flex-col items-center bg-[#0f172a] px-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
              step >= st.s ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}>
              {step > st.s ? <CheckCircle2 size={24} /> : st.label}
            </div>
          </div>
        ))}
      </div>

      <div className="panel-container lg:grid-cols-[1fr_400px]">
        {/* Left Side: Visual Data */}
        <div className="flex flex-col gap-4">

          {/* STEP 0: 0NF */}
          {step === 0 && (
            <div className="scenario-card animate-fade-in border-slate-500/30">
              <h3 className="scenario-title text-slate-400">0th Normal Form (UNF)</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                <strong>Problem:</strong> The data contains repeating groups and non-atomic values (arrays/comma-separated strings). <br/>
                Our <code className="text-slate-400">UNF_StudentRecords</code> table has multiple courses and instructors stuffed into single cells. This makes querying extremely difficult!
              </p>
              {renderTable('UNF_StudentRecords')}
              
              <div className="mt-4 flex justify-end">
                <button onClick={advanceTo1NF} className="btn-action bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2">
                  Decompose to 1NF (Atomic) <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
          
          {/* STEP 1: 1NF */}
          {step === 1 && (
            <div className="scenario-card animate-fade-in border-indigo-500/30">
              <h3 className="scenario-title text-indigo-400">1st Normal Form (1NF)</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                <strong>Rule:</strong> Data must be atomic (no arrays/lists in a cell). <br/>
                By executing inserts that break apart the comma-separated strings, we achieved 1NF. However, it suffers from severe insert, update, and delete anomalies. The Primary Key is the combination of <code>(student_id, course_id)</code>.
              </p>
              {renderTable('Norm1_StudentRecords')}
              
              <div className="mt-4 flex justify-end">
                <button onClick={advanceTo2NF} className="btn-action bg-purple-600 hover:bg-purple-500 flex items-center gap-2">
                  Decompose to 2NF <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 2NF */}
          {step === 2 && (
            <div className="scenario-card animate-fade-in border-purple-500/30">
              <h3 className="scenario-title text-purple-400">2nd Normal Form (2NF)</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                <strong>Rule:</strong> Must be in 1NF + No Partial Dependencies.<br/>
                <em>Partial Dependency:</em> When a non-key attribute depends on only <em>part</em> of a composite primary key. In 1NF, <code>student_name</code> depended only on <code>student_id</code>, not the full <code>(student_id, course_id)</code> key. We executed a decomposition to split them!
              </p>
              
              {renderTable('Norm2_Students')}
              <div className="grid grid-cols-2 gap-4">
                {renderTable('Norm2_Courses')}
                {renderTable('Norm2_Enrollments')}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={advanceTo3NF} className="btn-action bg-purple-600 hover:bg-purple-500 flex items-center gap-2">
                  Decompose to 3NF <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 3NF */}
          {step === 3 && (
            <div className="scenario-card animate-fade-in border-pink-500/30">
              <h3 className="scenario-title text-pink-400">3rd Normal Form (3NF)</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                <strong>Rule:</strong> Must be in 2NF + No Transitive Dependencies.<br/>
                <em>Transitive Dependency:</em> When a non-key attribute depends on another non-key attribute. In 2NF, <code>advisor</code> depended on <code>major</code>, not the student directly. We pulled Majors out to resolve this!
              </p>
              
              <div className="bg-pink-950/30 p-3 rounded border border-pink-500/20 mb-4 text-xs font-mono text-slate-300">
                <div className="text-pink-400 font-sans font-bold mb-1 text-[10px] uppercase tracking-wider">Relational Schema</div>
                <div>Students(<span className="underline decoration-pink-500 underline-offset-2">student_id</span>, student_name, major)</div>
                <div>Majors(<span className="underline decoration-pink-500 underline-offset-2">major</span>, advisor)</div>
                <div>Courses(<span className="underline decoration-pink-500 underline-offset-2">course_id</span>, course_name)</div>
                <div>Enrollments(<span className="underline decoration-pink-500 underline-offset-2">student_id, course_id</span>, instructor)</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderTable('Norm3_Students', { student_id: ['PK'], major: ['FK'] })}
                {renderTable('Norm3_Majors', { major: ['PK'] })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderTable('Norm2_Courses', { course_id: ['PK'] })}
                {renderTable('Norm2_Enrollments', { student_id: ['PK', 'FK'], course_id: ['PK', 'FK'] })}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={advanceTo4NFAnimation} className="btn-action bg-pink-600 hover:bg-pink-500 flex items-center gap-2">
                  Prove BCNF Violation <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CLOSURE ANIMATION */}
          {step === 4 && (
            <div className="scenario-card animate-fade-in border-orange-500/30">
              <h3 className="scenario-title text-orange-400">Visual Functional Dependency Mapping</h3>
              
              <div className="bg-[#0b0f19] p-6 rounded-lg border border-slate-700 font-mono text-sm shadow-inner relative overflow-hidden">
                <div className="mb-6">
                  {renderTable('Norm2_Enrollments', { student_id: ['PK', 'FK'], course_id: ['PK', 'FK'] })}
                </div>

                <div className="mb-6 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="bg-slate-800 px-4 py-2 rounded border border-slate-600 text-slate-300">
                      Let <strong className="text-rose-400">A</strong> = <code className="text-rose-200">instructor</code>
                    </div>
                  </div>
                  <div className="text-slate-500 flex flex-col items-center">
                    <span className="text-xs tracking-widest uppercase mb-1">Determines</span>
                    <ArrowRight size={24} className="text-orange-500" />
                  </div>
                  <div className="text-center">
                    <div className="bg-slate-800 px-4 py-2 rounded border border-slate-600 text-slate-300">
                      Let <strong className="text-blue-400">B</strong> = <code className="text-blue-200">course_id</code>
                    </div>
                  </div>
                </div>

                {animStep >= 1 && (
                  <div className="animate-fade-in mb-4 bg-slate-900 p-4 rounded border border-slate-800">
                    <div className="text-slate-400 mb-2">Mathematical Notation: <code className="text-lg text-white font-bold">A &rarr; B</code></div>
                    <div className="text-sm text-slate-500 font-sans">
                      We must determine the functional closure of <strong className="text-rose-400">A</strong>. If <code className="text-rose-400 font-mono">&#123;A&#125;<sup className="text-[10px]">+</sup></code> generates every column in the table, then <strong className="text-rose-400">A</strong> is a valid Primary Key candidate.
                    </div>
                  </div>
                )}

                {animStep >= 2 && (
                  <div className="animate-fade-in mb-4 bg-slate-900 p-4 rounded border border-slate-800">
                    <div className="text-slate-300 mb-2 font-bold font-sans">1. Start with A</div>
                    <code className="text-rose-400">&#123;A&#125;<sup className="text-[10px]">+</sup> = &#123; instructor &#125;</code>
                  </div>
                )}

                {animStep >= 3 && (
                  <div className="animate-fade-in mb-4 bg-slate-900 p-4 rounded border border-slate-800">
                    <div className="text-slate-300 mb-2 font-bold font-sans">2. Apply A &rarr; B</div>
                    <code className="text-rose-400">&#123;A&#125;<sup className="text-[10px]">+</sup> = &#123; instructor, course_id &#125;</code>
                  </div>
                )}

                {animStep >= 4 && (
                  <div className="animate-fade-in mt-6 bg-rose-950/40 p-5 rounded border border-rose-500/40">
                    <div className="text-rose-400 font-bold mb-3 text-lg font-sans">CONCLUSION</div>
                    <p className="text-slate-300 leading-relaxed mb-3 font-sans">
                      The closure of <strong className="text-rose-400">A</strong> is missing <code className="text-slate-400 bg-black/30 px-1 rounded">student_id</code>! 
                    </p>
                    <p className="text-slate-300 leading-relaxed font-sans">
                      Because <code className="text-rose-400 bg-black/30 px-1 rounded font-mono">&#123;A&#125;<sup className="text-[10px]">+</sup> &ne; &#123;student_id, course_id, instructor&#125;</code>, <strong className="text-rose-400">A</strong> is <strong>NOT</strong> a Candidate Key. Since <strong className="text-rose-400">A</strong> determines <strong className="text-blue-400">B</strong> but is not a Candidate Key, this violates <strong>Boyce-Codd Normal Form!</strong>
                    </p>
                  </div>
                )}

                {/* Animation Controls */}
                <div className="mt-8 flex justify-end gap-3 border-t border-slate-700/50 pt-4 font-sans">
                  {animStep < 4 ? (
                    <button onClick={() => setAnimStep(a => a + 1)} className="btn-action bg-slate-700 hover:bg-slate-600">
                      Next Step
                    </button>
                  ) : (
                    <button onClick={advanceToBCNF} className="btn-action bg-rose-600 hover:bg-rose-500 flex items-center gap-2 animate-pulse-glow">
                      Decompose to BCNF <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: BCNF */}
          {step === 5 && (
            <div className="scenario-card animate-fade-in border-rose-500/30">
              <h3 className="scenario-title text-rose-400">Boyce-Codd Normal Form (BCNF)</h3>
              <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                <strong>Rule:</strong> For every functional dependency <code>X &rarr; Y</code>, <code>X</code> must be a superkey.
              </p>
              
              <div className="bg-rose-950/30 p-3 rounded border border-rose-500/20 mb-4 text-xs text-slate-300 leading-relaxed">
                <p className="mb-2"><strong>The Hidden Dependency:</strong> In 3NF, our Enrollments table has the key <code>(student_id, course_id)</code>. But our business rule states an instructor teaches exactly 1 course. This means <code>instructor &rarr; course_id</code>.</p>
                <p className="mb-3"><strong>The Violation:</strong> Because <code>instructor</code> determines <code>course_id</code>, but <code>instructor</code> is NOT a candidate key for the whole table, it fails BCNF! We split Enrollments to fix this!</p>
                
                <div className="text-rose-400 font-sans font-bold mb-1 text-[10px] uppercase tracking-wider">Final Relational Schema</div>
                <div className="font-mono">Instructors(<span className="underline decoration-rose-500 underline-offset-2">instructor</span>, course_id)</div>
                <div className="font-mono">Enrollments(<span className="underline decoration-rose-500 underline-offset-2">student_id, instructor</span>)</div>
                <div className="text-[10px] italic mt-1 text-slate-500">(Students, Majors, and Courses remain unchanged)</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {renderTable('Norm3_Students', { student_id: ['PK'], major: ['FK'] })}
                {renderTable('Norm3_Majors', { major: ['PK'] })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderTable('NormBC_Enrollments', { student_id: ['PK', 'FK'], instructor: ['PK', 'FK'] })}
                {renderTable('NormBC_Instructors', { instructor: ['PK'] })}
              </div>
              
              <div className="mt-6 text-center text-emerald-400 font-bold bg-emerald-900/30 py-4 rounded border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                Database Successfully Normalized to BCNF!
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Terminal */}
        <div className="h-[700px] sticky top-24">
          <SqlTerminal history={history} title="SQL Engine" statusColor="bg-indigo-500" onRun={handleRun} />
        </div>
      </div>
    </div>
  );
}
