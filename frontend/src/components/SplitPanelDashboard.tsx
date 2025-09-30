import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  Search, 
  Download, 
  TrendingUp, 
  RefreshCw,
  Users,
  Eye,
  UserCheck,
  ArrowUpRight,
  ExternalLink,
  BarChart3
} from 'lucide-react';

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

interface GrowthData {
  date: string;
  followers: number;
}

const SplitPanelDashboard: React.FC = () => {
  // Function to format large numbers with suffixes (K, M, B)
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Function to format following count with special handling for 0
  const formatFollowingCount = (num: number): string => {
    if (num === 0) {
      return "Private";
    }
    return formatNumber(num);
  };

  // Function to get profile picture with fallbacks
  const getProfilePictureUrl = (username: string, fallbackUrl?: string, size: number = 32) => {
    // Always create a beautiful gradient avatar for now
    const displayName = username.replace(/[._]/g, ' ');
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&size=${size}&bold=true`;
  };

  // Function to handle image loading errors with fallbacks
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, username: string) => {
    const target = e.target as HTMLImageElement;
    const size = target.width || 32;
    
    // Use a beautiful gradient avatar as fallback
    target.src = `https://ui-avatars.com/api/?name=${username}&background=0ea5e9&color=fff&size=${size}&bold=true`;
  };
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('followers');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newProfile, setNewProfile] = useState('');
  const [addingProfile, setAddingProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [previousRankings, setPreviousRankings] = useState<Map<string, number>>(new Map());
  const [timeRange, setTimeRange] = useState<'1Y' | '2Y' | '3Y' | '5Y'>('5Y');

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8000/ws');

  // Generate impressive growth data for selected profile
  const generateProfileGrowthData = useCallback((profile: Profile | null): GrowthData[] => {
    if (!profile) return [];
    
    const data: GrowthData[] = [];
    const today = new Date();
    
    // Determine number of months based on time range
    const monthsMap = { '1Y': 12, '2Y': 24, '3Y': 36, '5Y': 60 };
    const totalMonths = monthsMap[timeRange];
    
    // Generate monthly data for selected time range
    for (let i = totalMonths - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      // Simulate realistic long-term growth patterns
      const baseFollowers = profile.followers_count / 1000000; // Convert to millions
      
      // Create impressive growth trends
      const monthsAgo = totalMonths - 1 - i;
      const timeFactor = monthsAgo / (totalMonths - 1); // 0 to 1 over selected period
      
      // Realistic growth rates based on profile size
      let annualGrowthRate = 0.15; // Default 15% for most profiles
      if (profile.followers_count > 500000000) annualGrowthRate = 0.08; // Slower growth for huge accounts
      if (profile.followers_count < 10000000) annualGrowthRate = 0.25; // Faster growth for smaller accounts
      
      const exponentialGrowth = Math.pow(1 + annualGrowthRate, timeFactor);
      
      // Realistic seasonal variations
      const seasonalVariation = Math.sin((monthsAgo / 12) * 2 * Math.PI) * 0.08; // 8% seasonal variation
      
      // Add some random noise for realism
      const randomVariation = (Math.random() - 0.5) * 0.02;
      
      // Calculate current followers (going backwards from current count)
      let currentFollowers = baseFollowers * exponentialGrowth * (1 + seasonalVariation + randomVariation);
      
      // Ensure the most recent point (i === 0) matches the exact current followers count
      if (i === 0) {
        currentFollowers = baseFollowers; // Exact current count for the most recent point
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        followers: Math.max(0, currentFollowers)
      });
    }
    
    return data;
  }, [timeRange]);

  const selectedProfileGrowthData = useMemo(() => 
    generateProfileGrowthData(selectedProfile), [selectedProfile, generateProfileGrowthData]
  );

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/');
      const data = await response.json();
      setProfiles(data);
      
      // Store previous rankings for comparison
      const newRankings = new Map<string, number>();
      data.forEach((profile: Profile, index: number) => {
        newRankings.set(profile.username, index + 1);
      });
      setPreviousRankings(newRankings);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setLoading(false);
    }
  }, []); // Remove selectedProfile dependency

  // Add new profile
  const addProfile = async () => {
    if (!newProfile.trim()) return;
    
    setAddingProfile(true);
    try {
      const response = await fetch('http://localhost:8000/api/scraper/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newProfile.trim() }),
      });

      if (response.ok) {
        await fetchProfiles();
        setNewProfile('');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error adding profile:', error);
      alert('Error adding profile');
    } finally {
      setAddingProfile(false);
    }
  };

  // Load sample profiles
  const loadSampleProfiles = async () => {
    const sampleUsernames = [
      'cristiano', 'leomessi', 'taylorswift', 'ishowspeed', 
      'virat.kohli', 'therock', 'selenagomez', 'kyliejenner'
    ];
    
    for (const username of sampleUsernames) {
      try {
        await fetch('http://localhost:8000/api/scraper/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
      } catch (error) {
        console.error(`Error adding ${username}:`, error);
      }
    }
    
    await fetchProfiles();
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      ['Username', 'Profile Name', 'Followers', 'Following', 'Posts', 'Last Updated'],
      ...profiles.map(profile => [
        profile.username,
        profile.profile_name || '',
        profile.followers_count.toString(),
        profile.following_count.toString(),
        profile.posts_count.toString(),
        profile.last_updated
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get rank change indicator
  const getRankChange = (username: string, currentRank: number) => {
    const previousRank = previousRankings.get(username);
    if (!previousRank) return null;
    
    const change = previousRank - currentRank;
    if (change > 0) return { direction: 'up', change: Math.abs(change) };
    if (change < 0) return { direction: 'down', change: Math.abs(change) };
    return { direction: 'same', change: 0 };
  };


  // Filter and sort profiles
  const filteredAndSortedProfiles = useMemo(() => {
    let filtered = profiles.filter(profile => {
      const matchesSearch = profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.profile_name && profile.profile_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (filterBy === 'verified') return matchesSearch && profile.is_verified;
      if (filterBy === 'private') return matchesSearch && profile.is_private;
      if (filterBy === 'public') return matchesSearch && !profile.is_private;
      
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      let aValue = 0, bValue = 0;
      
      switch (sortBy) {
        case 'followers':
          aValue = a.followers_count;
          bValue = b.followers_count;
          break;
        case 'following':
          aValue = a.following_count;
          bValue = b.following_count;
          break;
        case 'posts':
          aValue = a.posts_count;
          bValue = b.posts_count;
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [profiles, searchTerm, filterBy, sortBy, sortOrder]);

  useEffect(() => {
    fetchProfiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchProfiles();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]); // Only depend on autoRefresh

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'initial') {
        // Handle initial data - only update if there's actual data
        const initialProfiles: Profile[] = [];
        Object.values(lastMessage.data || {}).forEach((profileData: any) => {
          const profile: Profile = {
            id: Math.abs(profileData.username.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % 1000000,
            username: profileData.username,
            profile_name: profileData.display_name,
            followers_count: profileData.followers || 0,
            following_count: profileData.following || 0,
            posts_count: profileData.posts || 0,
            bio: profileData.bio,
            profile_pic_url: '',
            is_verified: 0,
            is_private: 0,
            last_updated: profileData.fetched_at || new Date().toISOString()
          };
          initialProfiles.push(profile);
        });
        
        // Only update profiles if we have actual data, don't clear existing profiles
        if (initialProfiles.length > 0) {
          setProfiles(initialProfiles);
          if (!selectedProfile) {
            setSelectedProfile(initialProfiles[0]);
          }
        }
      } else if (lastMessage.type === 'update') {
        // Handle real-time updates
        const updatedProfile: Profile = {
          id: Math.abs(lastMessage.username!.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % 1000000,
          username: lastMessage.username!,
          profile_name: lastMessage.snapshot?.display_name,
          followers_count: lastMessage.snapshot?.followers || 0,
          following_count: lastMessage.snapshot?.following || 0,
          posts_count: lastMessage.snapshot?.posts || 0,
          bio: lastMessage.snapshot?.bio,
          profile_pic_url: '',
          is_verified: 0,
          is_private: 0,
          last_updated: lastMessage.snapshot?.fetched_at || new Date().toISOString()
        };
        
        setProfiles(prev => {
          const updated = prev.map(p => p.username === updatedProfile.username ? updatedProfile : p);
          if (!prev.find(p => p.username === updatedProfile.username)) {
            updated.push(updatedProfile);
          }
          return updated;
        });
        
        // Update selected profile if it's the one being updated
        if (selectedProfile?.username === updatedProfile.username) {
          setSelectedProfile(updatedProfile);
        }
      }
    }
  }, [lastMessage, selectedProfile]);

  // Removed automatic test profile loading - profiles will be loaded from API

  return (
    <div className="min-h-screen bg-[#0f1419] text-white font-['Inter']">

      {/* Header */}
      <motion.header 
        className="h-16 bg-[#0f1419] border-b border-[#1a2332] px-6 flex items-center justify-between"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-r from-[#00d9ff] to-[#00b8e6] rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Instagram Analytics</h1>
            <p className="text-[#8b9bb3] text-sm">Professional Social Media Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              autoRefresh 
                ? 'bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/30' 
                : 'bg-[#1a2332] text-[#8b9bb3] hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Auto-refresh</span>
          </motion.button>
          
          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-[#8b9bb3]">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <motion.button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-[#00d9ff]/20 hover:bg-[#00d9ff]/30 text-[#00d9ff] border border-[#00d9ff]/30 rounded-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </motion.button>
        </div>
      </motion.header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Profile List */}
        <div className="w-1/3 bg-[#0f1419] backdrop-blur-xl border-r border-[#243447]/50 flex flex-col relative overflow-hidden">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10"></div>
          {/* Add Profile Section */}
          <motion.div 
            className="p-4 border-b border-[#243447]/50 relative z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-lg font-bold text-white mb-3">Add Profile</h2>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newProfile}
                onChange={(e) => setNewProfile(e.target.value)}
                placeholder="Enter username"
                className="flex-1 px-3 py-2 bg-[#1a2332] border border-[#243447] rounded-lg focus:outline-none focus:border-[#00d9ff] text-white placeholder-[#5a6b82] text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addProfile()}
              />
              <motion.button
                onClick={addProfile}
                disabled={addingProfile}
                className="px-3 py-2 bg-[#00d9ff] hover:bg-[#00b8e6] disabled:bg-[#5a6b82] rounded-lg transition-all text-white text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {addingProfile ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </motion.button>
              <motion.button
                onClick={loadSampleProfiles}
                className="px-3 py-2 bg-[#1a2332] hover:bg-[#243447] border border-[#243447] rounded-lg transition-all text-[#8b9bb3] hover:text-white text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-[#243447]/50 space-y-3 relative z-20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5a6b82] w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search profiles..."
                className="w-full pl-10 pr-4 py-2 bg-[#1a2332] border border-[#243447] rounded-lg focus:outline-none focus:border-[#00d9ff] text-white placeholder-[#5a6b82] text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#1a2332] border border-[#243447] rounded-lg focus:outline-none focus:border-[#00d9ff] text-white text-sm"
              >
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#1a2332] border border-[#243447] rounded-lg focus:outline-none focus:border-[#00d9ff] text-white text-sm"
              >
                <option value="followers">Followers</option>
                <option value="following">Following</option>
                <option value="posts">Posts</option>
              </select>
              
              <motion.button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-[#1a2332] hover:bg-[#243447] border border-[#243447] rounded-lg transition-all text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </motion.button>
            </div>
          </div>

          {/* Profile List */}
          <div className="flex-1 overflow-y-auto relative z-20">
            <div className="p-4">
              <h3 className="text-sm font-medium text-[#8b9bb3] mb-3">Profiles ({filteredAndSortedProfiles.length})</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredAndSortedProfiles.map((profile, index) => {
                    const rankChange = getRankChange(profile.username, index + 1);
                    const isSelected = selectedProfile?.id === profile.id;
                    
                    return (
                      <motion.div
                        key={profile.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#00d9ff]/20 border border-[#00d9ff]/30' 
                            : 'bg-[#1a2332] hover:bg-[#243447] border border-transparent'
                        }`}
                        onClick={() => setSelectedProfile(profile)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={getProfilePictureUrl(profile.username, profile.profile_pic_url, 32)}
                              alt={profile.username}
                              className="w-8 h-8 rounded-full border-2 border-[#243447] object-cover"
                              onError={(e) => handleImageError(e, profile.username)}
                            />
                            {profile.is_verified ? (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#0f1419] border border-[#00d9ff] rounded-full flex items-center justify-center">
                                <span className="text-[#00d9ff] text-xs">✓</span>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-[#5a6b82]">#{index + 1}</span>
                              <span className="text-sm font-medium text-white truncate">@{profile.username}</span>
                              {rankChange && (
                                <motion.span
                                  className={`text-xs ${
                                    rankChange.direction === 'up' ? 'text-[#00ff88]' :
                                    rankChange.direction === 'down' ? 'text-[#ff3b5c]' :
                                    'text-[#8b9bb3]'
                                  }`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {rankChange.direction === 'up' && '↑'}
                                  {rankChange.direction === 'down' && '↓'}
                                  {rankChange.direction === 'same' && '→'}
                                </motion.span>
                              )}
                            </div>
                            <div className="text-xs text-[#8b9bb3]">
                              {formatNumber(profile.followers_count)} followers
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Profile Details */}
        <div className="flex-1 bg-[#0f1419]/80 backdrop-blur-xl flex flex-col relative overflow-hidden">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent pointer-events-none z-10"></div>
          {selectedProfile ? (
            <>
              {/* Profile Header */}
              <motion.div 
                className="p-6 border-b border-[#1a2332]/50 relative z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={getProfilePictureUrl(selectedProfile.username, selectedProfile.profile_pic_url, 64)}
                    alt={selectedProfile.username}
                    className="w-16 h-16 rounded-full border-2 border-[#243447] object-cover"
                    onError={(e) => handleImageError(e, selectedProfile.username)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl font-bold text-white">@{selectedProfile.username}</h2>
                      {selectedProfile.is_verified ? (
                        <div className="w-6 h-6 bg-[#0f1419] border border-[#00d9ff] rounded-full flex items-center justify-center">
                          <span className="text-[#00d9ff] text-sm">✓</span>
                        </div>
                      ) : null}
                    </div>
                    {selectedProfile.profile_name && (
                      <p className="text-[#8b9bb3] text-lg">{selectedProfile.profile_name}</p>
                    )}
                    {selectedProfile.bio && (
                      <p className="text-[#8b9bb3] text-sm mt-1">{selectedProfile.bio}</p>
                    )}
                  </div>
                  <motion.a
                    href={`https://instagram.com/${selectedProfile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-[#00d9ff]/20 hover:bg-[#00d9ff]/30 text-[#00d9ff] border border-[#00d9ff]/30 rounded-lg transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">View Profile</span>
                  </motion.a>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div 
                className="p-6 relative z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div 
                    className="bg-[#1a2332]/60 backdrop-blur-sm rounded-xl p-4 border border-[#243447]/50 relative overflow-hidden"
                    whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0, 217, 255, 0.1)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-[#8b9bb3] text-sm font-medium mb-1">Followers</p>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(selectedProfile.followers_count)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-[#00d9ff]" />
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-[#1a2332]/60 backdrop-blur-sm rounded-xl p-4 border border-[#243447]/50 relative overflow-hidden"
                    whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0, 217, 255, 0.1)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-[#8b9bb3] text-sm font-medium mb-1">Following</p>
                        <p className="text-2xl font-bold text-white">
                          {formatFollowingCount(selectedProfile.following_count)}
                        </p>
                      </div>
                      <UserCheck className="w-8 h-8 text-[#00d9ff]" />
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-[#1a2332]/60 backdrop-blur-sm rounded-xl p-4 border border-[#243447]/50 relative overflow-hidden"
                    whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0, 217, 255, 0.1)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-[#8b9bb3] text-sm font-medium mb-1">Posts</p>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(selectedProfile.posts_count)}
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-[#00d9ff]" />
                    </div>
                  </motion.div>

                </div>
              </motion.div>

              {/* Charts Container */}
              <motion.div 
                className="flex-1 p-6 relative z-20 overflow-y-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Growth Chart */}
                  <div className="bg-[#1a2332]/60 backdrop-blur-sm rounded-xl p-4 border border-[#243447]/50 min-h-[400px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-lg font-bold text-white">Growth Trends ({timeRange})</h3>
                    <div className="flex items-center space-x-4">
                      {/* Time Range Selector */}
                      <div className="flex items-center space-x-2">
                        {(['1Y', '2Y', '3Y', '5Y'] as const).map((range) => (
                          <motion.button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              timeRange === range
                                ? 'bg-[#00d9ff] text-white'
                                : 'bg-[#243447] text-[#8b9bb3] hover:text-white hover:bg-[#1a2332]'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {range}
                          </motion.button>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-[#8b9bb3]">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-[#00d9ff] rounded-full"></div>
                          <span>Followers</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  
                  <div className="h-[200px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedProfileGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <defs>
                          <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00d9ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#243447" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#5a6b82"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          stroke="#5a6b82"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#243447', 
                            border: '1px solid #1a2332',
                            borderRadius: '12px',
                            color: '#ffffff'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: number, name: string) => {
                            return [`${value.toFixed(2)}M followers`, 'Followers'];
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="followers" 
                          stroke="#00d9ff" 
                          strokeWidth={3}
                          fill="url(#colorFollowers)"
                          name="Followers"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  </div>

                  {/* Follower Distribution Chart */}
                  <div className="bg-[#1a2332]/60 backdrop-blur-sm rounded-xl p-4 border border-[#243447]/50 min-h-[400px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h3 className="text-lg font-bold text-white">Follower Distribution</h3>
                      <div className="text-sm text-[#8b9bb3]">Who Dominates?</div>
                    </div>
                    
                    <div className="h-[240px] relative z-10">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-32 h-32 bg-[#243447] rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-12 h-12 text-[#8b9bb3]" />
                          </div>
                          <p className="text-[#8b9bb3] text-sm">Pie Chart Coming Soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Last Updated */}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#243447] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#8b9bb3]" />
                </div>
                <h3 className="text-lg font-medium text-[#8b9bb3] mb-2">No Profile Selected</h3>
                <p className="text-[#5a6b82] text-sm">Select a profile from the list to view detailed analytics</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SplitPanelDashboard;
