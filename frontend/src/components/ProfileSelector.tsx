import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '../utils/format';

// Helper function to get profile picture with fallbacks
const getProfilePictureUrl = (username: string, profilePicUrl?: string, size: number = 32) => {
  // Use real Instagram profile photo if available, otherwise create a beautiful gradient avatar
  if (profilePicUrl && profilePicUrl.trim() !== '') {
    return profilePicUrl;
  }
  const displayName = username.replace(/[._]/g, ' ');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&size=${size}&bold=true`;
};

interface Profile {
  id: number;
  username: string;
  profile_name: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  bio: string;
  profile_pic_url: string;
  is_verified: number;
  is_private: number;
  last_updated: string;
}

interface ProfileSelectorProps {
  onProfileSelect: (profile: Profile) => void;
  selectedProfile?: Profile | null;
  showSelector?: boolean;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ onProfileSelect, selectedProfile }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'following' | 'posts' | 'name'>('followers');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/');
      const data = await response.json();
      setProfiles(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setLoading(false);
    }
  };

  const filteredAndSortedProfiles = profiles
    .filter(profile => 
      profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.profile_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'followers':
          return b.followers_count - a.followers_count;
        case 'following':
          return b.following_count - a.following_count;
        case 'posts':
          return b.posts_count - a.posts_count;
        case 'name':
          return a.profile_name.localeCompare(b.profile_name);
        default:
          return 0;
      }
    });

  const handleProfileClick = (profile: Profile) => {
    onProfileSelect(profile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d9ff]"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search and Sort Controls */}
      <div className="p-4 border-b border-[#243447]/50">
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#243447] border border-[#1a2332] rounded-lg focus:outline-none focus:border-[#00d9ff] text-white placeholder-[#5a6b82] text-sm"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-[#243447] border border-[#1a2332] rounded-lg focus:outline-none focus:border-[#00d9ff] text-white text-sm"
          >
            <option value="followers">Followers</option>
            <option value="following">Following</option>
            <option value="posts">Posts</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div className="text-xs text-[#5a6b82]">
          {filteredAndSortedProfiles.length} profiles available
        </div>
      </div>

      {/* Profile List */}
      <div className="max-h-64 overflow-y-auto">
        {filteredAndSortedProfiles.length === 0 ? (
          <div className="p-4 text-center text-[#5a6b82]">
            No profiles found
          </div>
        ) : (
          filteredAndSortedProfiles.map((profile) => (
            <motion.div
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              className={`p-4 hover:bg-[#243447]/80 cursor-pointer transition-all duration-200 border-b border-[#243447]/30 last:border-b-0 ${
                selectedProfile?.id === profile.id ? 'bg-[#243447]/50' : ''
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={getProfilePictureUrl(profile.username, profile.profile_pic_url, 48)}
                  alt={profile.username}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getProfilePictureUrl(profile.username, '', 48);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white truncate">
                      {profile.profile_name || profile.username}
                    </span>
                    {profile.is_verified ? (
                      <span className="text-[#00d9ff] text-sm">✓</span>
                    ) : null}
                    {profile.is_private ? (
                      <span className="text-[#ff6b6b] text-sm">🔒</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[#5a6b82] truncate">
                    @{profile.username}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-[#5a6b82]">
                      {formatNumber(profile.followers_count)} followers
                    </span>
                    <span className="text-xs text-[#5a6b82]">
                      {formatNumber(profile.following_count)} following
                    </span>
                    <span className="text-xs text-[#5a6b82]">
                      {formatNumber(profile.posts_count)} posts
                    </span>
                  </div>
                </div>
                {selectedProfile?.id === profile.id && (
                  <div className="text-[#00d9ff] text-sm">✓</div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfileSelector;
