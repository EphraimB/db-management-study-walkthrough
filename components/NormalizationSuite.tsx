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
  const [step, setStep] = useState(1); 
  
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
    if (step === 1) refreshTables(['StudentRecords']);
    else if (step === 2) refreshTables(['Norm2_Students', 'Norm2_Courses', 'Norm2_Enrollments']);
    else if (step === 3) refreshTables(['Norm3_Students', 'Norm3_Majors', 'Norm2_Courses', 'Norm2_Enrollments']);
    else if (step === 4) refreshTables(['Norm3_Students', 'Norm3_Majors', 'NormBC_Instructors', 'NormBC_Enrollments']);
  }, [step, executeSilentQuery]);

  const handleRun = (query: string) => {
    const { results, error } = executeQuery(query);
    setHistory(prev => [...prev, { id: Date.now(), query, results, error }]);
  };

  const advanceTo2NF = () => {
    handleRun(`CREATE TABLE Norm2_Students AS SELECT DISTINCT student_id, student_name, major, advisor FROM StudentRecords;\nCREATE TABLE Norm2_Courses AS SELECT DISTINCT course_id, course_name FROM StudentRecords;\nCREATE TABLE Norm2_Enrollments AS SELECT DISTINCT student_id, course_id, instructor FROM StudentRecords;`);
    setStep(2);
  };

  const advanceTo3NF = () => {
    handleRun(`CREATE TABLE Norm3_Majors AS SELECT DISTINCT major, advisor FROM Norm2_Students;\nCREATE TABLE Norm3_Students AS SELECT DISTINCT student_id, student_name, major FROM Norm2_Students;`);
    setStep(3);
  };

  const advanceToBCNF = () => {
    handleRun(`CREATE TABLE NormBC_Instructors AS SELECT DISTINCT instructor, course_id FROM Norm2_Enrollments;\nCREATE TABLE NormBC_Enrollments AS SELECT DISTINCT student_id, instructor FROM Norm2_Enrollments;`);
    setStep(4);
  };

  const renderTable = (name: string) => {
    const t = tables[name];
    if (!t) return null;
    return (
      <div className="mb-4">
        <h4 className="text-indigo-300 text-xs font-bold mb-1 uppercase tracking-wider">{name}</h4>
        <div className="overflow-x-auto border border-slate-700 rounded max-h-[200px] custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800">
                {t.cols.map((c, i) => <th key={i} className="px-3 py-2 border-b border-slate-700 text-slate-300 sticky top-0 bg-slate-800">{c}</th>)}
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
      <div className="flex items-center justify-between mb-8 px-4 relative max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -z-10 -translate-y-1/2"></div>
        {[
          { s: 1, label: '1NF' },
          { s: 2, label: '2NF' },
          { s: 3, label: '3NF' },
          { s: 4, label: 'BCNF' }
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
          
          {/* STEP 1: 1NF */}
          {step === 1 && (
            <div className="scenario-card animate-fade-in border-indigo-500/30">
              <h3 className="scenario-title text-indigo-400">1st Normal Form (1NF)</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                <strong>Rule:</strong> Data must be atomic (no arrays/lists in a cell). <br/>
                Our <code className="text-indigo-400">StudentRecords</code> table already meets 1NF. However, it's a "Universal Relation" that suffers from severe insert, update, and delete anomalies. The Primary Key is the combination of <code>(student_id, course_id)</code>.
              </p>
              {renderTable('StudentRecords')}
              
              <div className="mt-4 flex justify-end">
                <button onClick={advanceTo2NF} className="btn-action bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2">
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
              
              <div className="grid grid-cols-2 gap-4">
                {renderTable('Norm3_Students')}
                {renderTable('Norm3_Majors')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderTable('Norm2_Courses')}
                {renderTable('Norm2_Enrollments')}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={advanceToBCNF} className="btn-action bg-pink-600 hover:bg-pink-500 flex items-center gap-2">
                  Decompose to BCNF <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BCNF */}
          {step === 4 && (
            <div className="scenario-card animate-fade-in border-rose-500/30">
              <h3 className="scenario-title text-rose-400">Boyce-Codd Normal Form (BCNF)</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                <strong>Rule:</strong> Every determinant must be a candidate key.<br/>
                In our Enrollments table, <code>instructor</code> mathematically determines <code>course_id</code> (an instructor teaches only 1 course), but <code>instructor</code> was not a candidate key. We split Enrollments to resolve this final anomaly!
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {renderTable('Norm3_Students')}
                {renderTable('Norm3_Majors')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderTable('NormBC_Enrollments')}
                {renderTable('NormBC_Instructors')}
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
