export const podcastAPI = {
    files: {
      select: async () => "/mock/path/to/document.pdf",
      upload: async () => ({ fileID: "mock-file-id" }),
      analyze: async () => ({
        page_count: 7,
        word_count: 2034,
        char_count: 11562,
        speakers: ["Alice", "Bob", "Kayla"],
        full_text: "This is a mocked preview of a PDF document for UI testing...",
        chunks: []
      })
    },
  
    podcast: {
      generate: async () => {
        return { jobId: "mock-job-id" };
      }
    },
  
    on: {
      progress: (callback) => {
        let value = 0;
        const interval = setInterval(() => {
          if (value >= 100) {
            clearInterval(interval);
            return;
          }
          value += 20;
          callback({ value, message: `Mock processing at ${value}%` });
        }, 300);
      }
    }
  };
  