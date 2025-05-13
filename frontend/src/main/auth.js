const { ipcMain } = require('electron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function initAuth() {
  // Login handler
  ipcMain.handle('auth:login', async (event, { email, password }) => {
    const db = getDb();
    
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          reject({ success: false, error: 'Database error' });
          return;
        }

        if (!user) {
          resolve({ success: false, error: 'User not found' });
          return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          resolve({ success: false, error: 'Invalid password' });
          return;
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        resolve({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            token
          }
        });
      });
    });
  });

  // Signup handler
  ipcMain.handle('auth:signup', async (event, { name, email, password }) => {
    const db = getDb();
    
    return new Promise(async (resolve, reject) => {
      // Check if email already exists
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
        if (err) {
          reject({ success: false, error: 'Database error' });
          return;
        }

        if (existingUser) {
          resolve({ success: false, error: 'Email already registered' });
          return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        db.run(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword],
          function(err) {
            if (err) {
              reject({ success: false, error: 'Failed to create user' });
              return;
            }

            const token = jwt.sign(
              { id: this.lastID, email },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            resolve({
              success: true,
              user: {
                id: this.lastID,
                name,
                email,
                token
              }
            });
          }
        );
      });
    });
  });

  // Token verification handler
  ipcMain.handle('auth:verify-token', async (event, { token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const db = getDb();

      return new Promise((resolve, reject) => {
        db.get('SELECT id, name, email FROM users WHERE id = ?', [decoded.id], (err, user) => {
          if (err || !user) {
            reject({ success: false, error: 'Invalid token' });
            return;
          }

          resolve({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              token
            }
          });
        });
      });
    } catch (err) {
      return { success: false, error: 'Invalid token' };
    }
  });
}

module.exports = { initAuth }; 