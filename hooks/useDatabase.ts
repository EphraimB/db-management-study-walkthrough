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
      database.run(`PRAGMA foreign_keys = ON;`);
      
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
        
        INSERT INTO BankAccounts (owner_name, balance) VALUES ('Alice', 1000.00);
        INSERT INTO BankAccounts (owner_name, balance) VALUES ('Bob', 500.00);
      `);
      
      setDb(database);
      setSavedDiskState(database.export()); // Initial save to "disk"
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
