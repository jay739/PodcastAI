const useMockAPI = false; // 🔁 Toggle this to false when backend is ready

import { podcastAPI as realAPI } from "./podcastAPI.js";
import { podcastAPI as mockAPI } from "./mockAPI.js";

export const podcastAPI = useMockAPI ? mockAPI : realAPI;
