const initSqlJs = require('sql.js');
initSqlJs().then(SQL => {
  const db = new SQL.Database();
  db.run("PRAGMA foreign_keys = ON;");
  db.run("CREATE TABLE A (id INTEGER PRIMARY KEY);");
  db.run("CREATE TABLE B (id INTEGER PRIMARY KEY, a_id INTEGER, FOREIGN KEY(a_id) REFERENCES A(id));");
  
  const exported = db.export();
  
  const db2 = new SQL.Database(exported);
  db2.run("PRAGMA foreign_keys = ON;"); // Is this working?
  try {
    db2.run("INSERT INTO B (a_id) VALUES (999);");
    console.log("SUCCESS");
  } catch (err) {
    console.log("ERROR on DB2:", err.message);
  }
});
