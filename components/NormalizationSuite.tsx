import React, { useState, useEffect } from 'react';
import SqlTerminal, { HistoryItem } from './SqlTerminal';
import { QueryExecResult } from 'sql.js';
import { ArrowRight, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NormalizationSuiteProps {
  executeQuery: (query: string) => { results: QueryExecResult[], error: string | null };
  executeSilentQuery: (query: string) => { results: QueryExecResult[], error: string | null };
}

export default function NormalizationSuite({ executeQuery, executeSilentQuery }: NormalizationSuiteProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [step, setStep] = useState(0); 
  const [animStep, setAnimStep] = useState(0); 
  
  const [indexStatus, setIndexStatus] = useState<'idle' | 'generating' | 'ready' | 'unoptimized_run' | 'indexed' | 'optimized_run'>('idle');
  const [unoptimizedTime, setUnoptimizedTime] = useState(0);
  const [optimizedTime, setOptimizedTime] = useState(0);
  const [queryPlan, setQueryPlan] = useState<any[][]>([]);

  const [tables, setTables] = useState<Record<string, { cols: string[], rows: any[][] }>>({});

  const refreshTables = (tableNames: string[]) => {
    const newTables: Record<string, { cols: string[], rows: any[][] }> = {};
    tableNames.forEach(tName => {
      const { results, error } = executeSilentQuery(`SELECT * FROM ${tName}`);
      if (!error && results.length > 0) {
        newTables[tName] = { cols: results[0].columns, rows: results[0].values };
      }
    });
    setTables(prev => ({ ...prev, ...newTables })); // Merge to keep old tables during transitions if needed
  };

  useEffect(() => {
    if (step === 0) refreshTables(['UNF_StudentRecords']);
    else if (step === 1) refreshTables(['Norm1_StudentRecords']);
    else if (step === 2) refreshTables(['Norm2_Students', 'Norm2_Courses', 'Norm2_Enrollments']);
    else if (step === 3) refreshTables(['Norm3_Students', 'Norm3_Majors', 'Norm2_Courses', 'Norm2_Enrollments']);
    else if (step === 4) refreshTables(['Norm3_Students', 'Norm3_Majors', 'NormBC_Instructors', 'NormBC_Enrollments']);
  }, [step, executeSilentQuery]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const advanceTo1NF = () => {
    handleRun(`CREATE TABLE Norm1_StudentRecords (student_id INTEGER, student_name TEXT, student_email TEXT, major TEXT, department_head TEXT, course_id TEXT, course_name TEXT, credits INTEGER, instructor TEXT, room_number TEXT);\nINSERT INTO Norm1_StudentRecords VALUES \n(1, 'Alice', 'alice@uni.edu', 'Computer Science', 'Dr. Smith', 'CS101', 'Intro', 4, 'Turing', 'R101'),\n(1, 'Alice', 'alice@uni.edu', 'Computer Science', 'Dr. Smith', 'MA101', 'Calc', 4, 'Newton', 'R102'),\n(2, 'Bob', 'bob@uni.edu', 'Biology', 'Dr. Jones', 'BI101', 'Intro', 4, 'Darwin', 'R201'),\n(2, 'Bob', 'bob@uni.edu', 'Biology', 'Dr. Jones', 'CS101', 'Intro', 4, 'Lovelace', 'R101'),\n(3, 'Charlie', 'charlie@uni.edu', 'Computer Science', 'Dr. Smith', 'CS101', 'Intro', 4, 'Turing', 'R101');`);
    setStep(1);
    setAnimStep(0);
  };

  const advanceTo2NF = () => {
    handleRun(`CREATE TABLE Norm2_Students AS SELECT DISTINCT student_id, student_name, student_email, major, department_head FROM Norm1_StudentRecords;\nCREATE TABLE Norm2_Courses AS SELECT DISTINCT course_id, course_name, credits FROM Norm1_StudentRecords;\nCREATE TABLE Norm2_Enrollments AS SELECT DISTINCT student_id, course_id, instructor, room_number FROM Norm1_StudentRecords;`);
    setStep(2);
    setAnimStep(0);
  };

  const advanceTo3NF = () => {
    handleRun(`CREATE TABLE Norm3_Majors AS SELECT DISTINCT major, department_head FROM Norm2_Students;\nCREATE TABLE Norm3_Students AS SELECT DISTINCT student_id, student_name, student_email, major FROM Norm2_Students;`);
    setStep(3);
    setAnimStep(0);
  };

  const advanceToBCNF = () => {
    handleRun(`CREATE TABLE NormBC_Instructors AS SELECT DISTINCT instructor, course_id, room_number FROM Norm2_Enrollments;\nCREATE TABLE NormBC_Enrollments AS SELECT DISTINCT student_id, instructor FROM Norm2_Enrollments;`);
    setStep(4);
    setAnimStep(0);
  };

  const advanceToIndexing = () => {
    setStep(5);
  };

  const renderFramerTable = (name: string, keys?: Record<string, string[]>, highlightCols?: string[], highlightColor: string = 'indigo') => {
    const t = tables[name];
    if (!t) return null;

    const bgHighlight = highlightColor === 'purple' ? 'bg-purple-900/40 border-purple-500/50' : 
                        highlightColor === 'pink' ? 'bg-pink-900/40 border-pink-500/50' :
                        highlightColor === 'rose' ? 'bg-rose-900/40 border-rose-500/50' :
                        'bg-indigo-900/40 border-indigo-500/50';

    return (
      <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
        transition={{ duration: 0.4 }}
        className="mb-4 bg-[#0b0f19] border border-slate-700 rounded-lg overflow-hidden custom-scrollbar max-w-full shadow-lg relative"
      >
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between z-20 relative">
          <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">{name}</span>
        </div>
        <div className="flex w-fit min-w-full relative">
          <AnimatePresence mode="popLayout">
            {t.cols.map((col, colIdx) => {
              const isHighlighted = highlightCols?.includes(col);
              return (
                <motion.div 
                  layout
                  key={col}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col min-w-[120px] transition-colors duration-500 ${isHighlighted ? `${bgHighlight} border-x relative z-10 shadow-[0_0_15px_currentColor]` : 'border-r border-slate-800/50'}`}
                >
                  <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 text-slate-300 text-xs font-bold whitespace-nowrap">
                    {col}
                    {keys?.[col]?.includes('PK') && <span className="ml-1.5 inline-block bg-amber-500/20 text-amber-400 border border-amber-500/50 px-1 rounded text-[9px] font-bold">PK</span>}
                    {keys?.[col]?.includes('FK') && <span className="ml-1.5 inline-block bg-blue-500/20 text-blue-400 border border-blue-500/50 px-1 rounded text-[9px] font-bold">FK</span>}
                  </div>
                  {t.rows.map((row, rowIdx) => (
                    <div key={rowIdx} className="px-3 py-2 border-b border-slate-800/50 text-slate-400 text-xs whitespace-nowrap h-9 flex items-center">
                      {String(row[colIdx])}
                    </div>
                  ))}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Rest of the indexing logic
  const generateMassiveData = () => {
    setIndexStatus('generating');
    setTimeout(() => {
      executeSilentQuery(`
        WITH RECURSIVE cnt(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM cnt WHERE x < 50000)
        INSERT INTO Norm3_Students (student_id, student_name, student_email, major) SELECT x+10, 'Student_' || x, 'student_' || x || '@uni.edu', 'Computer Science' FROM cnt;
      `);
      executeSilentQuery(`
        WITH RECURSIVE cnt(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM cnt WHERE x < 50000)
        INSERT INTO NormBC_Enrollments (student_id, instructor) SELECT x+10, 'Turing' FROM cnt;
      `);
      setIndexStatus('ready');
    }, 100);
  };

  const runUnoptimized = () => {
    const start = performance.now();
    executeSilentQuery(`SELECT s.student_name, c.course_name FROM Norm3_Students s JOIN NormBC_Enrollments e ON s.student_id = e.student_id JOIN NormBC_Instructors i ON e.instructor = i.instructor JOIN Norm2_Courses c ON i.course_id = c.course_id WHERE s.student_id > 45000;`);
    const end = performance.now();
    setUnoptimizedTime(end - start);
    const plan = executeSilentQuery(`EXPLAIN QUERY PLAN SELECT s.student_name FROM Norm3_Students s JOIN NormBC_Enrollments e ON s.student_id = e.student_id;`);
    setQueryPlan(plan.results[0]?.values || []);
    setIndexStatus('unoptimized_run');
  };

  const applyIndexes = () => {
    handleRun(`CREATE INDEX idx_student ON NormBC_Enrollments(student_id);\nCREATE INDEX idx_instructor ON NormBC_Enrollments(instructor);`);
    setIndexStatus('indexed');
  };

  const runOptimized = () => {
    const start = performance.now();
    executeSilentQuery(`SELECT s.student_name, c.course_name FROM Norm3_Students s JOIN NormBC_Enrollments e ON s.student_id = e.student_id JOIN NormBC_Instructors i ON e.instructor = i.instructor JOIN Norm2_Courses c ON i.course_id = c.course_id WHERE s.student_id > 45000;`);
    const end = performance.now();
    setOptimizedTime(end - start);
    const plan = executeSilentQuery(`EXPLAIN QUERY PLAN SELECT s.student_name FROM Norm3_Students s JOIN NormBC_Enrollments e ON s.student_id = e.student_id;`);
    setQueryPlan(plan.results[0]?.values || []);
    setIndexStatus('optimized_run');
  };

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-6">
        <h1 className="suite-header">Normalization & Dependencies</h1>
        <p className="suite-subtitle">Watch an unnormalized (UNF) table get mathematically decomposed into BCNF via animated splits.</p>
      </header>

      {/* Progress Steps UI */}
      <div className="flex items-center justify-between mb-8 px-4 relative max-w-3xl mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -z-10 -translate-y-1/2 rounded-full"></div>
        {[
          { s: 0, label: 'UNF' },
          { s: 1, label: '1NF' },
          { s: 2, label: '2NF' },
          { s: 3, label: '3NF' },
          { s: 4, label: 'BCNF' },
          { s: 5, label: 'INDEX' }
        ].map(st => (
          <div key={st.s} className="flex flex-col items-center bg-[#0f172a] px-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-500 ${
              step >= st.s ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}>
              {step > st.s ? <CheckCircle2 size={24} /> : st.label}
            </div>
          </div>
        ))}
      </div>

      <div className="panel-container lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* STEP 0: 0NF */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="scenario-card border-slate-500/30">
                <h3 className="scenario-title text-slate-400">0th Normal Form (UNF)</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  <strong>Problem:</strong> Repeating groups and missing Primary Keys. The table represents multiple courses per student using blank rows (<code>NULL</code>). We cannot use standard SQL constraints or primary keys on this!
                </p>
                {renderFramerTable('UNF_StudentRecords')}
                <div className="mt-4 flex justify-end">
                  <button onClick={advanceTo1NF} className="btn-action bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2">
                    Decompose to 1NF (Fill Blanks) <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* STEP 1: 1NF to 2NF Split */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="scenario-card border-indigo-500/30 overflow-hidden">
                <h3 className="scenario-title text-indigo-400">1st Normal Form (1NF) &rarr; 2NF</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  Data is atomic, but we have a <strong className="text-purple-400">Partial Dependency</strong>. <br/>
                  The Primary Key is <code>(student_id, course_id)</code>, but <code>student_name</code> depends ONLY on <code>student_id</code>!
                </p>

                {animStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-purple-950/40 border border-purple-500/50 p-4 rounded-lg mb-4 flex items-start gap-3 text-purple-200">
                    <AlertTriangle className="shrink-0 mt-0.5 text-purple-400" size={18} />
                    <div>
                      <div className="font-bold text-purple-400 mb-1 font-mono">student_id &rarr; student_name, student_email, major...</div>
                      <div className="text-sm">These attributes don't care about the <code>course_id</code>. We must split them out to form a <code>Students</code> table to eliminate data redundancy and formally establish Primary Keys!</div>
                    </div>
                  </motion.div>
                )}

                {renderFramerTable('Norm1_StudentRecords', {}, animStep === 1 ? ['student_id', 'student_name', 'student_email', 'major', 'department_head'] : [], 'purple')}
                
                <div className="mt-4 flex justify-end gap-3">
                  {animStep === 0 ? (
                    <button onClick={() => setAnimStep(1)} className="btn-action bg-slate-700 hover:bg-slate-600 flex items-center gap-2">
                      Find Dependencies <Lightbulb size={16} />
                    </button>
                  ) : (
                    <button onClick={advanceTo2NF} className="btn-action bg-purple-600 hover:bg-purple-500 flex items-center gap-2 animate-pulse-glow">
                      Extract to 2NF <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: 2NF to 3NF Split */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="scenario-card border-purple-500/30 overflow-hidden">
                <h3 className="scenario-title text-purple-400">2nd Normal Form (2NF) &rarr; 3NF</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  No partial dependencies exist, but we have a <strong className="text-pink-400">Transitive Dependency</strong> in the Students table.
                </p>

                {animStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-pink-950/40 border border-pink-500/50 p-4 rounded-lg mb-4 flex items-start gap-3 text-pink-200">
                    <AlertTriangle className="shrink-0 mt-0.5 text-pink-400" size={18} />
                    <div>
                      <div className="font-bold text-pink-400 mb-1 font-mono">major &rarr; department_head</div>
                      <div className="text-sm">The <code>department_head</code> depends on the <code>major</code>, not directly on the <code>student_id</code>. We must extract this into a <code>Majors</code> table!</div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col gap-4">
                  {renderFramerTable('Norm2_Students', { student_id: ['PK'] }, animStep === 1 ? ['major', 'department_head'] : [], 'pink')}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderFramerTable('Norm2_Courses', { course_id: ['PK'] })}
                    {renderFramerTable('Norm2_Enrollments', { student_id: ['PK'], course_id: ['PK'] })}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  {animStep === 0 ? (
                    <button onClick={() => setAnimStep(1)} className="btn-action bg-slate-700 hover:bg-slate-600 flex items-center gap-2">
                      Find Dependencies <Lightbulb size={16} />
                    </button>
                  ) : (
                    <button onClick={advanceTo3NF} className="btn-action bg-pink-600 hover:bg-pink-500 flex items-center gap-2 animate-pulse-glow">
                      Extract to 3NF <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: 3NF & BCNF Decision */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="scenario-card border-pink-500/30 overflow-hidden">
                <h3 className="scenario-title text-pink-400">3rd Normal Form (3NF) &rarr; BCNF</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  We are technically in 3NF, but there's a hidden anomaly in <code>Enrollments</code> involving the Candidate Keys. We must formally prove this using the Left/Both/Right algorithm.
                </p>

                {animStep >= 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-700 p-4 rounded-lg mb-4 text-slate-200">
                    <div className="font-bold text-orange-400 mb-2 font-mono uppercase tracking-wider text-xs">Step 1: Functional Dependencies (FDs)</div>
                    <div className="text-sm mb-3">
                      FD1: <code className="text-emerald-400">student_id, course_id &rarr; instructor, room_number</code><br/>
                      FD2: <code className="text-rose-400">instructor &rarr; course_id, room_number</code> <span className="text-xs text-slate-400">(Business Rule)</span>
                    </div>

                    {animStep >= 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 border-t border-slate-700 pt-4">
                        <div className="text-orange-400 mb-2 font-bold text-xs uppercase tracking-wider font-sans">Step 2: Sort Attributes into L/B/R Sets</div>
                        <table className="w-full text-center border-collapse border border-slate-700 text-sm">
                          <thead>
                            <tr className="bg-slate-800">
                              <th className="p-2 border border-slate-700 text-emerald-400 font-sans">LEFT <br/><span className="text-[10px] font-normal text-slate-400">(Must be in Key)</span></th>
                              <th className="p-2 border border-slate-700 text-amber-400 font-sans">BOTH <br/><span className="text-[10px] font-normal text-slate-400">(Might be in Key)</span></th>
                              <th className="p-2 border border-slate-700 text-rose-400 font-sans">RIGHT <br/><span className="text-[10px] font-normal text-slate-400">(Never in Key)</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-[#0b0f19] font-mono">
                              <td className="p-3 border border-slate-700">student_id</td>
                              <td className="p-3 border border-slate-700">course_id, instructor</td>
                              <td className="p-3 border border-slate-700">room_number</td>
                            </tr>
                          </tbody>
                        </table>
                      </motion.div>
                    )}

                    {animStep >= 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 border-t border-slate-700 pt-4 text-sm">
                        <div className="text-orange-400 mb-2 font-bold text-xs uppercase tracking-wider font-sans">Step 3: Combine LEFT + BOTH to find Keys</div>
                        <code className="text-amber-400">&#123;student_id, course_id&#125;<sup className="text-[10px]">+</sup> = &#123; student_id, course_id, instructor, room_number &#125;</code> <span className="text-emerald-400 font-bold ml-2">✓ Valid Key</span><br/>
                        <code className="text-amber-400">&#123;student_id, instructor&#125;<sup className="text-[10px]">+</sup> = &#123; student_id, instructor, course_id, room_number &#125;</code> <span className="text-emerald-400 font-bold ml-2">✓ Valid Key</span>
                      </motion.div>
                    )}

                    {animStep >= 4 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-rose-950/40 border border-rose-500/50 p-4 rounded text-sm text-rose-200">
                        <span className="font-bold text-rose-400 text-lg block mb-2">Step 4: The Violation Proof</span>
                        Look at FD2: <code className="bg-rose-900/50 px-1 rounded">instructor &rarr; course_id, room_number</code>.<br/><br/>
                        The determinant is <code>instructor</code>. However, <code className="bg-rose-900/50 px-1 rounded">&#123;instructor&#125;<sup className="text-[10px]">+</sup></code> does not contain <code>student_id</code>, meaning it is NOT a Candidate Key! 
                        <br/><br/>
                        Because <code>instructor</code> determines values but is not a key, we must split it!
                      </motion.div>
                    )}
                  </motion.div>
                )}

                <div className="flex flex-col gap-4">
                  {renderFramerTable('Norm2_Enrollments', { student_id: ['PK'], course_id: ['PK'] }, animStep >= 4 ? ['instructor', 'course_id', 'room_number'] : [], 'rose')}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                    {renderFramerTable('Norm3_Students')}
                    {renderFramerTable('Norm3_Majors')}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  {animStep === 0 ? (
                    <button onClick={() => setAnimStep(1)} className="btn-action bg-slate-700 hover:bg-slate-600 flex items-center gap-2">
                      Analyze BCNF Compliance <Lightbulb size={16} />
                    </button>
                  ) : animStep === 1 ? (
                    <button onClick={() => setAnimStep(2)} className="btn-action bg-slate-700 hover:bg-slate-600">
                      Sort L/B/R
                    </button>
                  ) : animStep === 2 ? (
                    <button onClick={() => setAnimStep(3)} className="btn-action bg-slate-700 hover:bg-slate-600">
                      Test Keys
                    </button>
                  ) : animStep === 3 ? (
                    <button onClick={() => setAnimStep(4)} className="btn-action bg-slate-700 hover:bg-slate-600">
                      Find Violation
                    </button>
                  ) : (
                    <button onClick={advanceToBCNF} className="btn-action bg-rose-600 hover:bg-rose-500 flex items-center gap-2 animate-pulse-glow">
                      Decompose to BCNF <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: FINAL BCNF */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }} className="scenario-card border-emerald-500/30 overflow-hidden">
                <h3 className="scenario-title text-emerald-400">Boyce-Codd Normal Form (BCNF)</h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  The database is fully normalized! Every determinant is a candidate key. Data anomalies have been mathematically eliminated.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {renderFramerTable('NormBC_Enrollments', { student_id: ['PK', 'FK'], instructor: ['PK', 'FK'] })}
                  {renderFramerTable('NormBC_Instructors', { instructor: ['PK'] })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFramerTable('Norm3_Students', { student_id: ['PK'], major: ['FK'] })}
                  {renderFramerTable('Norm3_Majors', { major: ['PK'] })}
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={advanceToIndexing} className="btn-action bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2">
                    Test Performance <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: INDEXING (Previously 6) */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="scenario-card border-indigo-500/30">
                <h3 className="scenario-title text-indigo-400">The Tradeoff: Indexing</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  Normalization is beautiful, but requires expensive <code>JOIN</code> operations. Foreign Keys are NOT automatically indexed!
                </p>
                {/* Indexing Content exactly as before */}
                <div className="bg-[#0b0f19] p-6 rounded-lg border border-slate-700 font-mono text-sm shadow-inner relative">
                  {indexStatus === 'idle' && (
                    <div className="text-center py-6">
                      <button onClick={generateMassiveData} className="btn-action bg-emerald-600 hover:bg-emerald-500 font-sans">
                        Generate 50k Rows
                      </button>
                    </div>
                  )}
                  {indexStatus === 'generating' && (
                    <div className="text-center py-6 text-emerald-400 font-bold animate-pulse">Injecting 50,000 rows...</div>
                  )}
                  {(indexStatus === 'ready' || indexStatus === 'unoptimized_run' || indexStatus === 'indexed' || indexStatus === 'optimized_run') && (
                    <div className="animate-fade-in">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded text-center">
                          <div className="text-slate-400 text-xs mb-2">Unindexed Time</div>
                          <div className="text-3xl font-bold text-rose-400">{unoptimizedTime === 0 ? '--' : `${unoptimizedTime.toFixed(1)} ms`}</div>
                        </div>
                        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded text-center">
                          <div className="text-slate-400 text-xs mb-2">Indexed Time</div>
                          <div className="text-3xl font-bold text-emerald-400">{optimizedTime === 0 ? '--' : `${optimizedTime.toFixed(1)} ms`}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-4 font-sans">
                        {indexStatus === 'ready' && <button onClick={runUnoptimized} className="btn-action bg-rose-600">Run Unoptimized</button>}
                        {indexStatus === 'unoptimized_run' && <button onClick={applyIndexes} className="btn-action bg-indigo-600 animate-pulse-glow">CREATE INDEX</button>}
                        {indexStatus === 'indexed' && <button onClick={runOptimized} className="btn-action bg-emerald-600 animate-pulse-glow">Run Optimized</button>}
                        {indexStatus === 'optimized_run' && <div className="text-emerald-400 font-bold border border-emerald-500/50 bg-emerald-900/30 px-6 py-2 rounded">Complete!</div>}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Terminal */}
        <div className="h-[700px] sticky top-24">
          <SqlTerminal history={history} title="SQL Engine" statusColor="bg-indigo-500" onRun={handleRun} />
        </div>
      </div>
    </div>
  );
}
