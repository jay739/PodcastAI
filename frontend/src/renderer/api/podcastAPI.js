const baseAPI = window.podcastAPI;

export const podcastAPI = {
  ...baseAPI,
  podcast: {
    generate: async (config) => {
      const response = await baseAPI.podcast.generate(config);
      return response;
    },
    previewVoice: async (config) => {
      const response = await baseAPI.podcast.previewVoice(config);
      return response;
    }
  }
};
