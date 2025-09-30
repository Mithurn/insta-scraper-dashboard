import { useQuery } from 'react-query';
import { api } from '../services/api';

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

export const useProfiles = () => {
  return useQuery<Profile[]>('profiles', () => api.getProfiles(), {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useRankedProfiles = (sortBy: string = 'followers_count', order: string = 'desc') => {
  return useQuery<ProfileRanking[]>(
    ['ranked-profiles', sortBy, order],
    () => api.getRankedProfiles(sortBy, order),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
};

export const useProfile = (username: string) => {
  return useQuery<Profile>(
    ['profile', username],
    () => api.getProfile(username),
    {
      enabled: !!username,
    }
  );
};
