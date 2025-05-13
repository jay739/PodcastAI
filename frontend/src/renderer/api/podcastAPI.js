const baseAPI = window.podcastAPI;

export const podcastAPI = {
  ...baseAPI,
  podcast: {
    generate: async (config) => {
      const response = await window.electron.ipcRenderer.invoke('podcast:generate', config);
      return response;
    },
    previewVoice: async (config) => {
      const response = await window.electron.ipcRenderer.invoke('podcast:previewVoice', config);
      return response;
    }
  }
};
