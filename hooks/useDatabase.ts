import { useState, useEffect, useRef } from 'react';
import initSqlJs, { Database, QueryExecResult, SqlJsStatic } from 'sql.js';

export function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const SQLRef = useRef<SqlJsStatic | null>(null);

  // We keep track of the "disk" state. 
  // We only write to disk when NOT inside an uncommitted transaction.
  const [savedDiskState, setSavedDiskState] = useState<Uint8Array | null>(null);
  const [inTransaction, setInTransaction] = useState(false);

  const initDb = async () => {
    try {
      const SQL = SQLRef.current || await initSqlJs({ locateFile: file => `/${file}` });
      SQLRef.current = SQL;

      const database = new SQL.Database();
      
      // Strict constraints needed for ACID simulation
      database.exec(`PRAGMA foreign_keys = ON;`);
      
      database.run(`
        CREATE TABLE BankAccounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_name TEXT NOT NULL,
          balance DECIMAL(10,2) NOT NULL CHECK (balance >= 0)
        );
        
        CREATE TABLE Transfers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_account INTEGER NOT NULL,
          to_account INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          FOREIGN KEY(from_account) REFERENCES BankAccounts(id),
          FOREIGN KEY(to_account) REFERENCES BankAccounts(id)
        );
        
        CREATE TABLE Departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dept_name TEXT NOT NULL
        );
        
        CREATE TABLE Employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          emp_name TEXT NOT NULL,
          department_id INTEGER,
          salary DECIMAL(10,2) NOT NULL,
          FOREIGN KEY(department_id) REFERENCES Departments(id)
        );
        
        CREATE TABLE Sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          sale_date DATE NOT NULL,
          region TEXT NOT NULL,
          FOREIGN KEY(employee_id) REFERENCES Employees(id)
        );
        
        -- Universal Relation for Normalization (Violates 1NF, 2NF, 3NF, BCNF)
        CREATE TABLE UNF_StudentRecords (
          student_id INTEGER,
          student_name TEXT,
          student_email TEXT,
          major TEXT,
          department_head TEXT,
          course_data TEXT
        );

        INSERT INTO BankAccounts (owner_name, balance) VALUES ('Alice', 1000.00);
        INSERT INTO BankAccounts (owner_name, balance) VALUES ('Bob', 500.00);
        
        INSERT INTO Departments (dept_name) VALUES ('Engineering'), ('HR'), ('Sales');
        INSERT INTO Employees (emp_name, department_id, salary) VALUES 
          ('Alice', 1, 90000.00),
          ('Bob', 1, 85000.00),
          ('Charlie', 2, 60000.00),
          ('Diana', 3, 75000.00),
          ('Eve', NULL, 50000.00);
          
        INSERT INTO Sales (employee_id, amount, sale_date, region) VALUES 
          (1, 1500.00, '2023-10-01', 'North'),
          (1, 2000.00, '2023-10-05', 'North'),
          (2, 800.00, '2023-10-02', 'South'),
          (3, 5000.00, '2023-10-10', 'East'),
          (3, 1200.00, '2023-10-15', 'East'),
          (4, 300.00, '2023-10-20', 'West');
          
        INSERT INTO UNF_StudentRecords VALUES 
          (1, 'Alice', 'alice@uni.edu', 'Computer Science', 'Dr. Smith', 'CS101:Intro(4)-Turing[R101], MA101:Calc(4)-Newton[R102]'),
          (2, 'Bob', 'bob@uni.edu', 'Biology', 'Dr. Jones', 'BI101:Intro(4)-Darwin[R201], CS101:Intro(4)-Lovelace[R101]'),
          (3, 'Charlie', 'charlie@uni.edu', 'Computer Science', 'Dr. Smith', 'CS101:Intro(4)-Turing[R101]');
      `);
      
      setDb(database);
      setSavedDiskState(database.export()); // Initial save to "disk"
      database.exec(`PRAGMA foreign_keys = ON;`); // export() wipes connection pragmas
      setIsReady(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    initDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeQuery = (query: string): { results: QueryExecResult[], error: string | null } => {
    if (!db) return { results: [], error: 'Database not initialized' };
    
    try {
      // Simulate MySQL by allowing AUTO_INCREMENT keyword
      let simulatedQuery = query.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
      simulatedQuery = simulatedQuery.replace(/START TRANSACTION/gi, 'BEGIN TRANSACTION');
      
      // --- STORED PROCEDURE MOCK ENGINE ---
      simulatedQuery = simulatedQuery.replace(/DELIMITER\s+\S+/gi, '').trim();

      const createProcMatch = simulatedQuery.match(/CREATE\s+PROCEDURE\s+(\w+)\s*\(([\s\S]*?)\)\s*BEGIN\s+([\s\S]*?)\s+END/i);
      if (createProcMatch) {
        const procName = createProcMatch[1];
        const paramsRaw = createProcMatch[2];
        const body = createProcMatch[3];
        
        const paramNames = paramsRaw.split(',').map(p => {
          const parts = p.trim().split(/\s+/);
          if (parts[0].toUpperCase() === 'IN' || parts[0].toUpperCase() === 'OUT' || parts[0].toUpperCase() === 'INOUT') {
            return parts.length > 1 ? parts[1] : '';
          }
          return parts[0];
        }).filter(Boolean);

        (SQLRef.current as any).__mockProcedures = (SQLRef.current as any).__mockProcedures || {};
        (SQLRef.current as any).__mockProcedures[procName.toUpperCase()] = { paramNames, body };
        
        return { results: [], error: null };
      }

      const callProcMatch = simulatedQuery.match(/CALL\s+(\w+)\s*\(([\s\S]*?)\)/i);
      if (callProcMatch) {
        const procName = callProcMatch[1].toUpperCase();
        const argsRaw = callProcMatch[2];
        const args = argsRaw.split(',').map(a => a.trim());
        
        const procedures = (SQLRef.current as any).__mockProcedures || {};
        const proc = procedures[procName];
        if (!proc) {
          return { results: [], error: `Procedure ${callProcMatch[1]} does not exist` };
        }
        
        let procQuery = proc.body;
        proc.paramNames.forEach((pName: string, i: number) => {
          const regex = new RegExp(`\\b${pName}\\b`, 'gi');
          procQuery = procQuery.replace(regex, args[i]);
        });
        
        simulatedQuery = procQuery;
      }
      // --- END STORED PROCEDURE MOCK ENGINE ---

      const res = db.exec(simulatedQuery);
      
      // Simple heuristic to track transaction state
      const upperQuery = query.toUpperCase();
      let currentTransState = inTransaction;
      
      if (upperQuery.includes('BEGIN') || upperQuery.includes('START TRANSACTION')) currentTransState = true;
      if (upperQuery.includes('COMMIT') || upperQuery.includes('ROLLBACK')) currentTransState = false;
      
      setInTransaction(currentTransState);

      // Durability mechanism: only export to "disk" if auto-commit is active (not in transaction)
      if (!currentTransState) {
        setSavedDiskState(db.export());
        db.exec("PRAGMA foreign_keys = ON;"); // export() wipes connection pragmas
      }
      
      return { results: res, error: null };
    } catch (err: any) {
      return { results: [], error: err.message };
    }
  };

  const simulateCrash = () => {
    if (!SQLRef.current || !savedDiskState) return "Disk state missing!";
    setIsReady(false);
    db?.close();
    
    // Restore from "disk"
    const newDb = new SQLRef.current.Database(savedDiskState);
    newDb.exec("PRAGMA foreign_keys = ON;");
    setDb(newDb);
    setInTransaction(false);
    setIsReady(true);
    return "SERVER CRASH! In-memory database destroyed. System rebooted and restored from last committed disk state.";
  };

  const executeSilentQuery = (query: string): { results: QueryExecResult[], error: string | null } => {
    if (!db) return { results: [], error: 'Database not initialized' };
    try {
      const res = db.exec(query);
      return { results: res, error: null };
    } catch (err: any) {
      return { results: [], error: err.message };
    }
  };

  return { db, isReady, error, executeQuery, executeSilentQuery, simulateCrash, initDb, inTransaction, savedDiskState, SQLStatic: SQLRef.current };
}
