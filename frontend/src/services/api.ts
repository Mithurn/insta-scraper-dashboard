import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface Profile {
  id: number;
  username: string;
  profile_name: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  bio: string | null;
  profile_pic_url: string | null;
  is_verified: number;
  is_private: number;
  last_updated: string;
  created_at: string;
}

export interface ProfileRanking {
  rank: number;
  username: string;
  profile_name: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  is_verified: number;
  last_updated: string;
}

export interface ScrapeRequest {
  usernames: string[];
}

export interface ScrapeResponse {
  success_count: number;
  failed_count: number;
  results: Array<{
    username: string;
    action: string;
    error?: string;
  }>;
}

export const api = {
  // Profile endpoints
  getProfiles: async (): Promise<Profile[]> => {
    const response = await apiClient.get('/api/profiles/');
    return response.data;
  },

  getRankedProfiles: async (sortBy: string = 'followers_count', order: string = 'desc'): Promise<ProfileRanking[]> => {
    const response = await apiClient.get('/api/profiles/ranked', {
      params: { by: sortBy, order }
    });
    return response.data;
  },

  getProfile: async (username: string): Promise<Profile> => {
    const response = await apiClient.get(`/api/profiles/${username}`);
    return response.data;
  },

  searchProfiles: async (query: string): Promise<Profile[]> => {
    const response = await apiClient.get(`/api/profiles/search/${query}`);
    return response.data;
  },

  createProfile: async (profileData: Partial<Profile>): Promise<Profile> => {
    const response = await apiClient.post('/api/profiles/', profileData);
    return response.data;
  },

  updateProfile: async (username: string, profileData: Partial<Profile>): Promise<Profile> => {
    const response = await apiClient.put(`/api/profiles/${username}`, profileData);
    return response.data;
  },

  deleteProfile: async (username: string): Promise<void> => {
    await apiClient.delete(`/api/profiles/${username}`);
  },

  // Scraper endpoints
  scrapeSingleProfile: async (username: string): Promise<any> => {
    const response = await apiClient.post('/api/scraper/profile', { username });
    return response.data;
  },

  scrapeProfiles: async (request: ScrapeRequest): Promise<ScrapeResponse> => {
    const response = await apiClient.post('/api/scraper/profiles/sync', request);
    return response.data;
  },

  scrapeProfilesBackground: async (request: ScrapeRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/scraper/profiles', request);
    return response.data;
  },

  updateAllProfiles: async (): Promise<{ message: string; count: number }> => {
    const response = await apiClient.post('/api/scraper/update-all');
    return response.data;
  },

  getScraperStatus: async (): Promise<any> => {
    const response = await apiClient.get('/api/scraper/status');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default api;
