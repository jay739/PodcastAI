const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'podcastAPI',
    {
        auth: {
            login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
            signup: (userData) => ipcRenderer.invoke('auth:signup', userData),
            logout: () => ipcRenderer.invoke('auth:logout'),
            verifyToken: (token) => ipcRenderer.invoke('auth:verify-token', { token }),
            getCurrentUser: async () => {
                const token = localStorage.getItem('token');
                if (!token) return null;
                try {
                    const result = await ipcRenderer.invoke('auth:verify-token', { token });
                    return result.success ? result.user : null;
                } catch (error) {
                    console.error('Error getting current user:', error);
                    return null;
                }
            }
        }
    }
) 