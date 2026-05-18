import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface ErdSuiteProps {
  executeQuery: (query: string) => any;
  executeSilentQuery: (query: string) => any;
}

// Visual Building Blocks for the ERD
const Entity = ({ x, y, name, type = 'strong', opacity = 100 }: any) => (
  <div 
    className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold tracking-wider text-xs z-20 transition-all duration-700
    ${type === 'strong' ? 'bg-indigo-600 text-white w-24 h-12 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-transparent text-indigo-300 w-24 h-12 flex items-center justify-center p-0.5 shadow-lg'}
    opacity-${opacity}`}
    style={{ left: x, top: y }}
  >
    {type === 'weak' ? (
      <div className="border-[3px] border-indigo-400 w-full h-full flex items-center justify-center bg-slate-900/80 backdrop-blur">
        <div className="border border-indigo-400 w-[94%] h-[85%] flex items-center justify-center text-[11px]">
          {name}
        </div>
      </div>
    ) : name}
  </div>
);

const Attribute = ({ x, y, name, type = 'normal', opacity = 100 }: any) => (
  <div 
    className={`absolute transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border-2 border-slate-600 rounded-[50%] w-24 h-10 flex items-center justify-center text-[10px] font-bold text-slate-300 z-20 shadow-lg transition-all duration-700 opacity-${opacity}`}
    style={{ left: x, top: y }}
  >
    {type === 'pk' && <span className="underline decoration-2 underline-offset-2 text-emerald-400">{name}</span>}
    {type === 'partial' && <span className="border-b-2 border-dashed border-rose-400 text-rose-300">{name}</span>}
    {type === 'normal' && name}
  </div>
);

const Relationship = ({ x, y, name, type = 'normal', opacity = 100 }: any) => (
  <div 
    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 z-20 flex items-center justify-center transition-all duration-700 opacity-${opacity}`}
    style={{ left: x, top: y }}
  >
    <div className={`absolute w-12 h-12 rotate-45 flex items-center justify-center ${type === 'normal' ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border-[3px] border-emerald-500'}`}>
      {type === 'identifying' && <div className="w-[85%] h-[85%] border border-emerald-500" />}
    </div>
    <span className="relative z-30 text-[9px] font-bold text-white tracking-wider uppercase">{name}</span>
  </div>
);

const Line = ({ x1, y1, x2, y2, label = '', opacity = 100 }: any) => {
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (
    <div 
      className={`absolute bg-slate-500 z-10 origin-left transition-all duration-700 opacity-${opacity}`}
      style={{ left: x1, top: y1, width: length, height: 2, transform: `rotate(${angle}deg)` }}
    >
      {label && (
        <span 
          className="absolute text-slate-300 font-bold text-[10px] bg-slate-900 px-1 py-0.5 rounded shadow-sm border border-slate-700 z-30"
          style={{ transform: `translate(-50%, -50%) rotate(${-angle}deg)`, left: '50%', top: '50%' }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default function ErdSuite({ executeQuery, executeSilentQuery }: ErdSuiteProps) {
  const [step, setStep] = useState(0);

  // Coordinate system for the ERD Canvas (800x450)
  const POS = {
    // Entities
    doc: { x: 150, y: 225 },
    pat: { x: 650, y: 150 },
    dep: { x: 650, y: 350 },
    // Relationships
    treats: { x: 400, y: 150 },
    has: { x: 650, y: 250 },
    // Doc Attrs
    doc_lic: { x: 50, y: 150 },
    doc_name: { x: 80, y: 300 },
    doc_spec: { x: 220, y: 300 },
    // Pat Attrs
    pat_id: { x: 550, y: 80 },
    pat_name: { x: 650, y: 50 },
    pat_dob: { x: 750, y: 80 },
    // Treats Attrs
    treats_date: { x: 330, y: 70 },
    treats_dx: { x: 470, y: 70 },
    // Dep Attrs
    dep_name: { x: 530, y: 400 },
    dep_rel: { x: 770, y: 400 },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="bg-emerald-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">ER</span>
            Entity-Relationship Mapping
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm">
            Before we normalize a database, we must design it conceptually! Learn how to extract requirements, draw an ER Diagram, and algorithmically map it to SQL tables.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-2 overflow-x-auto custom-scrollbar pb-2">
        {[
          { s: 0, label: 'Scenario' },
          { s: 1, label: 'Entities' },
          { s: 2, label: 'Attributes' },
          { s: 3, label: 'Relationships' },
          { s: 4, label: 'Table Mapping' }
        ].map(st => (
          <div key={st.s} className="flex flex-col items-center bg-[#0f172a] px-2">
            <div className={`h-10 px-4 rounded-full flex items-center justify-center font-bold border-2 transition-colors text-xs whitespace-nowrap ${
              step >= st.s ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}>
              {step > st.s ? <CheckCircle2 size={16} className="mr-2" /> : null}
              {st.label}
            </div>
          </div>
        ))}
      </div>

      {/* Main Scenario Readout */}
      <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-lg shadow-xl">
        <h3 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Business Requirements: Hospital System</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          <span className={step >= 1 ? "bg-indigo-900/50 text-indigo-200 px-1 rounded" : ""}>A Hospital employs Doctors.</span> 
          <span className={step >= 2 ? "bg-slate-700 px-1 rounded mx-1" : "mx-1"}>Each Doctor has a unique License Number, Name, and Specialty.</span> 
          <span className={step >= 1 ? "bg-indigo-900/50 text-indigo-200 px-1 rounded" : ""}>Doctors treat Patients.</span> 
          <span className={step >= 2 ? "bg-slate-700 px-1 rounded mx-1" : "mx-1"}>A Patient has a unique Patient ID, Name, and Date of Birth.</span> 
          <span className={step >= 3 ? "bg-emerald-900/50 text-emerald-200 px-1 rounded" : ""}>A Doctor can treat MANY Patients, and a Patient can be treated by MANY Doctors.</span> 
          <span className={step >= 2 ? "bg-slate-700 px-1 rounded mx-1" : "mx-1"}>When a treatment occurs, we record the Date and Diagnosis.</span> 
          <span className={step >= 1 ? "bg-indigo-900/50 text-indigo-200 px-1 rounded" : ""}>Patients can also have Dependents.</span> 
          <span className={step >= 2 ? "bg-slate-700 px-1 rounded mx-1" : "mx-1"}>Dependents have a Name and Relation.</span> 
          <span className={step >= 3 ? "bg-emerald-900/50 text-emerald-200 px-1 rounded border-b border-rose-500" : ""}>However, a Dependent cannot exist in the system without their parent Patient.</span>
        </p>
      </div>

      {/* ERD Canvas */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-lg w-full h-[450px] relative overflow-hidden hidden md:block">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDB2NDBNNDAgMHY0ME0wIDBoNDBNMCA0MGg0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50" />
        
        {/* Step 1: Entities */}
        <Entity x={POS.doc.x} y={POS.doc.y} name="Doctor" opacity={step >= 1 ? 100 : 0} />
        <Entity x={POS.pat.x} y={POS.pat.y} name="Patient" opacity={step >= 1 ? 100 : 0} />
        <Entity x={POS.dep.x} y={POS.dep.y} name="Dependent" type="weak" opacity={step >= 1 ? 100 : 0} />

        {/* Step 2: Attributes */}
        <Attribute x={POS.doc_lic.x} y={POS.doc_lic.y} name="License_No" type="pk" opacity={step >= 2 ? 100 : 0} />
        <Attribute x={POS.doc_name.x} y={POS.doc_name.y} name="Name" opacity={step >= 2 ? 100 : 0} />
        <Attribute x={POS.doc_spec.x} y={POS.doc_spec.y} name="Specialty" opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.doc.x} y1={POS.doc.y} x2={POS.doc_lic.x} y2={POS.doc_lic.y} opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.doc.x} y1={POS.doc.y} x2={POS.doc_name.x} y2={POS.doc_name.y} opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.doc.x} y1={POS.doc.y} x2={POS.doc_spec.x} y2={POS.doc_spec.y} opacity={step >= 2 ? 100 : 0} />

        <Attribute x={POS.pat_id.x} y={POS.pat_id.y} name="Patient_ID" type="pk" opacity={step >= 2 ? 100 : 0} />
        <Attribute x={POS.pat_name.x} y={POS.pat_name.y} name="Name" opacity={step >= 2 ? 100 : 0} />
        <Attribute x={POS.pat_dob.x} y={POS.pat_dob.y} name="DOB" opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.pat.x} y1={POS.pat.y} x2={POS.pat_id.x} y2={POS.pat_id.y} opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.pat.x} y1={POS.pat.y} x2={POS.pat_name.x} y2={POS.pat_name.y} opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.pat.x} y1={POS.pat.y} x2={POS.pat_dob.x} y2={POS.pat_dob.y} opacity={step >= 2 ? 100 : 0} />

        <Attribute x={POS.dep_name.x} y={POS.dep_name.y} name="Dep_Name" type="partial" opacity={step >= 2 ? 100 : 0} />
        <Attribute x={POS.dep_rel.x} y={POS.dep_rel.y} name="Relation" opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.dep.x} y1={POS.dep.y} x2={POS.dep_name.x} y2={POS.dep_name.y} opacity={step >= 2 ? 100 : 0} />
        <Line x1={POS.dep.x} y1={POS.dep.y} x2={POS.dep_rel.x} y2={POS.dep_rel.y} opacity={step >= 2 ? 100 : 0} />

        {/* Step 3: Relationships */}
        <Relationship x={POS.treats.x} y={POS.treats.y} name="Treats" opacity={step >= 3 ? 100 : 0} />
        <Relationship x={POS.has.x} y={POS.has.y} name="Has" type="identifying" opacity={step >= 3 ? 100 : 0} />
        
        <Line x1={POS.doc.x} y1={POS.doc.y} x2={POS.treats.x} y2={POS.treats.y} label="M" opacity={step >= 3 ? 100 : 0} />
        <Line x1={POS.treats.x} y1={POS.treats.y} x2={POS.pat.x} y2={POS.pat.y} label="N" opacity={step >= 3 ? 100 : 0} />
        
        <Line x1={POS.pat.x} y1={POS.pat.y} x2={POS.has.x} y2={POS.has.y} label="1" opacity={step >= 3 ? 100 : 0} />
        {/* Double line for total participation to weak entity */}
        <div className={`absolute transition-all duration-700 opacity-${step >= 3 ? 100 : 0}`} style={{ zIndex: 10 }}>
          <Line x1={POS.has.x-2} y1={POS.has.y} x2={POS.dep.x-2} y2={POS.dep.y} label="N" opacity={100} />
          <Line x1={POS.has.x+2} y1={POS.has.y} x2={POS.dep.x+2} y2={POS.dep.y} opacity={100} />
        </div>

        {/* Relationship Attributes */}
        <Attribute x={POS.treats_date.x} y={POS.treats_date.y} name="Date" opacity={step >= 3 ? 100 : 0} />
        <Attribute x={POS.treats_dx.x} y={POS.treats_dx.y} name="Diagnosis" opacity={step >= 3 ? 100 : 0} />
        <Line x1={POS.treats.x} y1={POS.treats.y} x2={POS.treats_date.x} y2={POS.treats_date.y} opacity={step >= 3 ? 100 : 0} />
        <Line x1={POS.treats.x} y1={POS.treats.y} x2={POS.treats_dx.x} y2={POS.treats_dx.y} opacity={step >= 3 ? 100 : 0} />
      </div>

      <div className="md:hidden text-center text-slate-500 py-4 border border-slate-700 rounded-lg">
        Please view on a desktop screen to see the interactive ER Diagram canvas.
      </div>

      {/* Explanation & Controls */}
      <div className="scenario-card border-emerald-500/30">
        {step === 0 && (
          <div className="animate-fade-in">
            <h3 className="text-emerald-400 font-bold mb-2">Step 1: Extract Entities</h3>
            <p className="text-sm text-slate-300 mb-4">
              Read the scenario above. The first step in drawing an ER Diagram is identifying the <strong>Nouns</strong> (Entities). <br/>
              Notice that "Dependents" cannot exist without a Patient. This makes Dependents a <strong>Weak Entity</strong>.
            </p>
            <div className="flex justify-end">
              <button onClick={() => setStep(1)} className="btn-action bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">Extract Entities <ArrowRight size={16}/></button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="text-emerald-400 font-bold mb-2">Step 2: Add Attributes</h3>
            <p className="text-sm text-slate-300 mb-4">
              Now we extract the properties for each entity. <br/>
              Strong entities get a Primary Key (underlined). Weak entities don't have a unique key, they just have a <strong>Partial Key</strong> (dashed underline) which only identifies them relative to their parent.
            </p>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="btn-action bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">Map Attributes <ArrowRight size={16}/></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h3 className="text-emerald-400 font-bold mb-2">Step 3: Define Relationships</h3>
            <div className="text-sm text-slate-300 mb-4">
              Now we identify the <strong>Verbs</strong> linking our nouns. 
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Doctors <strong>Treat</strong> Patients (Many-to-Many). M:N relationships can actually have their own attributes (Date, Diagnosis)!</li>
                <li>Patients <strong>Have</strong> Dependents (1-to-Many). Because Dependents are weak, this is an <strong>Identifying Relationship</strong> (double diamond).</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(3)} className="btn-action bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">Draw Relationships <ArrowRight size={16}/></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h3 className="text-emerald-400 font-bold mb-2">Step 4: The Mapping Algorithm</h3>
            <p className="text-sm text-slate-300 mb-4">
              The ERD is complete! Now, how do we turn a picture into a database? <br/>
              There are formal algorithmic rules to convert this visual map into Relational SQL Tables. Let's execute the mapping algorithm!
            </p>
            <div className="flex justify-end">
              <button onClick={() => setStep(4)} className="btn-action bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">Run Mapping Algorithm <ArrowRight size={16}/></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h3 className="text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm border-b border-emerald-500/30 pb-2">ERD to Relational Schema Mapping Rules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-700 p-4 rounded text-sm shadow-inner">
                <div className="text-indigo-400 font-bold mb-2">Rule 1: Strong Entities</div>
                <p className="text-slate-400 text-xs mb-3">Every strong entity becomes a table. Its attributes become columns.</p>
                <code className="text-xs text-emerald-300 block bg-black/50 p-3 rounded whitespace-pre-wrap font-mono">
                  CREATE TABLE Doctors (<br/>
                  &nbsp;&nbsp;License_No INT PK,<br/>
                  &nbsp;&nbsp;Name TEXT,<br/>
                  &nbsp;&nbsp;Specialty TEXT<br/>
                  );<br/><br/>
                  CREATE TABLE Patients (<br/>
                  &nbsp;&nbsp;Patient_ID INT PK,<br/>
                  &nbsp;&nbsp;Name TEXT,<br/>
                  &nbsp;&nbsp;DOB DATE<br/>
                  );
                </code>
              </div>

              <div className="bg-slate-900 border border-slate-700 p-4 rounded text-sm shadow-inner">
                <div className="text-rose-400 font-bold mb-2">Rule 2: Weak Entities</div>
                <p className="text-slate-400 text-xs mb-3">A weak entity becomes a table. <strong>It must inherit the Primary Key of its parent</strong> to form a composite Primary Key.</p>
                <code className="text-xs text-emerald-300 block bg-black/50 p-3 rounded whitespace-pre-wrap font-mono">
                  CREATE TABLE Dependents (<br/>
                  &nbsp;&nbsp;<span className="text-rose-300 font-bold">Patient_ID INT,</span><br/>
                  &nbsp;&nbsp;Dep_Name TEXT,<br/>
                  &nbsp;&nbsp;Relation TEXT,<br/>
                  &nbsp;&nbsp;PRIMARY KEY (Patient_ID, Dep_Name),<br/>
                  &nbsp;&nbsp;FOREIGN KEY (Patient_ID) <br/>&nbsp;&nbsp;&nbsp;&nbsp;REFERENCES Patients<br/>
                  );
                </code>
              </div>

              <div className="bg-slate-900 border border-slate-700 p-4 rounded text-sm shadow-inner">
                <div className="text-emerald-400 font-bold mb-2">Rule 3: M:N Relationships</div>
                <p className="text-slate-400 text-xs mb-3">Many-to-Many relationships must become their own <strong>Bridge Table</strong> containing the PKs of both entities + its own attributes.</p>
                <code className="text-xs text-emerald-300 block bg-black/50 p-3 rounded whitespace-pre-wrap font-mono">
                  CREATE TABLE Treats (<br/>
                  &nbsp;&nbsp;<span className="text-emerald-400 font-bold">License_No INT,</span><br/>
                  &nbsp;&nbsp;<span className="text-emerald-400 font-bold">Patient_ID INT,</span><br/>
                  &nbsp;&nbsp;Date DATE,<br/>
                  &nbsp;&nbsp;Diagnosis TEXT,<br/>
                  &nbsp;&nbsp;PRIMARY KEY (License_No, Patient_ID, Date)<br/>
                  );
                </code>
              </div>
            </div>

            <div className="mt-6 text-center text-emerald-400 font-bold bg-emerald-900/30 py-4 rounded border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              Conceptual Design Complete! The tables are now ready for Normalization!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
