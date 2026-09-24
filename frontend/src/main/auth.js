// If this file only contained ipcMain.handle('auth:...') registrations, it can be deleted.
// If there is other logic, keep only that logic and remove all ipcMain.handle('auth:...') calls.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Utility functions for authentication
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function generateToken(userId, email) {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  verifyPassword,
  hashPassword,
  generateToken,
  verifyToken,
  JWT_SECRET
}; 