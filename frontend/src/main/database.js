const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db;

async function initDatabase() {
  const dbPath = path.join(__dirname, '../../data/database.sqlite');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }

      // Create users table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Database initialized successfully');
        resolve();
      });
    });
  });
}

function getDb() {
  return db;
}

module.exports = {
  initDatabase,
  getDb
}; 