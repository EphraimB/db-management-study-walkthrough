const initSqlJs = require('sql.js');
initSqlJs().then(SQL => {
  const db = new SQL.Database();
  db.exec("PRAGMA foreign_keys = ON;");
  db.run("CREATE TABLE A (id INTEGER PRIMARY KEY);");
  db.run("CREATE TABLE B (id INTEGER PRIMARY KEY, a_id INTEGER, FOREIGN KEY(a_id) REFERENCES A(id));");
  
  db.export(); // Does this reset the connection state?

  try {
    db.run("INSERT INTO B (a_id) VALUES (999);");
    console.log("SUCCESS RUN");
  } catch (err) {
    console.log("ERROR RUN:", err.message);
  }
});
