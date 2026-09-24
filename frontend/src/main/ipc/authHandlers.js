const { ipcMain } = require('electron');
const log = require('electron-log');

function setupAuthHandlers() {
  if (!global.authHandlersInitialized) {
    log.info('Setting up auth handlers...');

    ipcMain.handle('login', async (event, { username, password }) => {
      try {
        // TODO: Implement actual authentication logic
        // For now, return a mock successful login
        return {
          success: true,
          user: {
            username,
            email: `${username}@example.com`
          }
        };
      } catch (error) {
        log.error('Login error:', error);
        return {
          success: false,
          message: 'Login failed'
        };
      }
    });

    ipcMain.handle('signup', async (event, { username, email, password }) => {
      try {
        // TODO: Implement actual signup logic
        // For now, return a mock successful signup
        return {
          success: true,
          user: {
            username,
            email
          }
        };
      } catch (error) {
        log.error('Signup error:', error);
        return {
          success: false,
          message: 'Signup failed'
        };
      }
    });

    ipcMain.handle('logout', async () => {
      try {
        // TODO: Implement actual logout logic
        return { success: true };
      } catch (error) {
        log.error('Logout error:', error);
        return { success: false };
      }
    });

    ipcMain.handle('get-current-user', async () => {
      try {
        // TODO: Implement actual user retrieval
        // For now, return a mock user
        return {
          success: true,
          user: {
            username: 'testuser',
            email: 'test@example.com'
          }
        };
      } catch (error) {
        log.error('Get current user error:', error);
        return { success: false };
      }
    });

    global.authHandlersInitialized = true;
    log.info('Auth handlers setup complete');
  } else {
    log.info('Auth handlers already initialized, skipping...');
  }
}

module.exports = { setupAuthHandlers }; 