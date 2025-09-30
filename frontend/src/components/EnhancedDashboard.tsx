import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Users,
  Heart,
  Eye,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';

interface Profile {
  id: number;
  username: string;
  profile_name: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  bio: string;
  profile_pic_url: string;
  is_verified: number;
  is_private: number;
  last_updated: string;
}

interface ProfileRanking {
  rank: number;
  username: string;
  profile_name: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  is_verified: number;
  is_private: number;
  last_updated: string;
}

interface GrowthData {
  date: string;
  [key: string]: string | number;
}

const EnhancedDashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('followers');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newProfile, setNewProfile] = useState('');
  const [addingProfile, setAddingProfile] = useState(false);
  const [hoveredProfile, setHoveredProfile] = useState<Profile | null>(null);
  const [previousRankings, setPreviousRankings] = useState<Map<string, number>>(new Map());

  // Generate mock growth data for the chart
  const generateGrowthData = (): GrowthData[] => {
    const data: GrowthData[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dataPoint: GrowthData = {
        date: date.toISOString().split('T')[0],
      };

      // Generate realistic growth data for top profiles
      const profilesToShow = ['cristiano', 'leomessi', 'taylorswift', 'ishowspeed'];
      profilesToShow.forEach(username => {
        const profile = profiles.find(p => p.username === username);
        if (profile) {
          // Simulate realistic growth patterns
          const baseFollowers = profile.followers_count;
          const growthFactor = 1 + (Math.random() - 0.5) * 0.02; // ±1% daily variation
          const trendGrowth = Math.sin(i / 7) * 0.01; // Weekly trend
          const dailyGrowth = (baseFollowers * (growthFactor + trendGrowth)) / 1000000; // Convert to millions
          
          dataPoint[profile.username] = Math.max(0, dailyGrowth);
        }
      });

      data.push(dataPoint);
    }
    
    return data;
  };

  const growthData = useMemo(() => generateGrowthData(), [profiles]);

  // Fetch profiles
  const fetchProfiles = async () => {
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
  };

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
      ['Username', 'Profile Name', 'Followers', 'Following', 'Posts', 'Engagement Rate', 'Last Updated'],
      ...profiles.map(profile => [
        profile.username,
        profile.profile_name || '',
        profile.followers_count.toString(),
        profile.following_count.toString(),
        profile.posts_count.toString(),
        `${profile.engagement_rate.toFixed(2)}%`,
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

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
        case 'engagement':
          aValue = a.engagement_rate;
          bValue = b.engagement_rate;
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [profiles, searchTerm, filterBy, sortBy, sortOrder]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchProfiles, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const totalFollowers = profiles.reduce((sum, profile) => sum + profile.followers_count, 0);
  const totalPosts = profiles.reduce((sum, profile) => sum + profile.posts_count, 0);
  const avgEngagement = profiles.length > 0 ? profiles.reduce((sum, profile) => sum + profile.engagement_rate, 0) / profiles.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <motion.header 
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Instagram Analytics Dashboard
                </h1>
                <p className="text-gray-400 text-sm">
                  Advanced Production-Grade Social Media Analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span>Auto-refresh</span>
              </motion.button>
              
              <motion.button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Followers</p>
                <p className="text-3xl font-bold text-white">
                  <CountUp end={totalFollowers} duration={2} separator="," />
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-300" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 shadow-lg"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Total Posts</p>
                <p className="text-3xl font-bold text-white">
                  <CountUp end={totalPosts} duration={2} separator="," />
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-300" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Avg Engagement</p>
                <p className="text-3xl font-bold text-white">
                  <CountUp end={avgEngagement} duration={2} decimals={1} suffix="%" />
                </p>
              </div>
              <Heart className="w-8 h-8 text-purple-300" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl p-6 shadow-lg"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-200 text-sm font-medium">Profiles Tracked</p>
                <p className="text-3xl font-bold text-white">
                  <CountUp end={profiles.length} duration={2} />
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-cyan-300" />
            </div>
          </motion.div>
        </motion.div>

        {/* Growth Chart */}
        <motion.div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">📈 Follower Growth Trends (Last 30 Days)</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Cristiano</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Messi</span>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Taylor Swift</span>
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>IShowSpeed</span>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [`${value.toFixed(2)}M followers`, name]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cristiano" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="Cristiano Ronaldo"
                />
                <Line 
                  type="monotone" 
                  dataKey="leomessi" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  name="Lionel Messi"
                />
                <Line 
                  type="monotone" 
                  dataKey="taylorswift" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  name="Taylor Swift"
                />
                <Line 
                  type="monotone" 
                  dataKey="ishowspeed" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  name="IShowSpeed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Add Profile Section */}
        <motion.div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Add New Profile</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={newProfile}
                onChange={(e) => setNewProfile(e.target.value)}
                placeholder="Enter Instagram username (e.g., cristiano)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && addProfile()}
              />
            </div>
            <motion.button
              onClick={addProfile}
              disabled={addingProfile}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg transition-all text-white font-medium flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {addingProfile ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Add Profile</span>
                </>
              )}
            </motion.button>
            <motion.button
              onClick={loadSampleProfiles}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all text-white font-medium flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="w-4 h-4" />
              <span>Load Sample Data</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search profiles..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
            >
              <option value="all">All Profiles</option>
              <option value="verified">Verified Only</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
            >
              <option value="followers">Sort by Followers</option>
              <option value="following">Sort by Following</option>
              <option value="posts">Sort by Posts</option>
              <option value="engagement">Sort by Engagement</option>
            </select>
            
            <motion.button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-all text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </motion.button>
          </div>
        </motion.div>

        {/* Profiles Table */}
        <motion.div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Profile</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Followers</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Following</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Posts</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Engagement</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <AnimatePresence>
                  {filteredAndSortedProfiles.map((profile, index) => {
                    const rankChange = getRankChange(profile.username, index + 1);
                    
                    return (
                      <motion.tr
                        key={profile.id}
                        className="hover:bg-gray-700/30 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onMouseEnter={() => setHoveredProfile(profile)}
                        onMouseLeave={() => setHoveredProfile(null)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-white">#{index + 1}</span>
                            {rankChange && (
                              <motion.span
                                className={`flex items-center space-x-1 text-sm ${
                                  rankChange.direction === 'up' ? 'text-green-400' :
                                  rankChange.direction === 'down' ? 'text-red-400' :
                                  'text-gray-400'
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                {rankChange.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
                                {rankChange.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
                                {rankChange.direction === 'same' && <ArrowRight className="w-3 h-3" />}
                                <span>
                                  {rankChange.direction === 'up' && `↑${rankChange.change}`}
                                  {rankChange.direction === 'down' && `↓${rankChange.change}`}
                                  {rankChange.direction === 'same' && '→'}
                                </span>
                              </motion.span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={profile.profile_pic_url || `https://ui-avatars.com/api/?name=${profile.username}&background=0ea5e9&color=fff&size=40`}
                                alt={profile.username}
                                className="w-10 h-10 rounded-full border-2 border-gray-600"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${profile.username}&background=0ea5e9&color=fff&size=40`;
                                }}
                              />
                              {profile.is_verified && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">@{profile.username}</div>
                              {profile.profile_name && (
                                <div className="text-sm text-gray-400">{profile.profile_name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            <CountUp end={profile.followers_count} duration={1} separator="," />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            <CountUp end={profile.following_count} duration={1} separator="," />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            <CountUp end={profile.posts_count} duration={1} separator="," />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-cyan-400">
                            <CountUp end={profile.engagement_rate} duration={1} decimals={1} suffix="%" />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">
                            {new Date(profile.last_updated).toLocaleString()}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Profile Hover Card */}
        <AnimatePresence>
          {hoveredProfile && (
            <motion.div
              className="fixed top-4 right-4 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-2xl z-50 max-w-sm"
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={hoveredProfile.profile_pic_url || `https://ui-avatars.com/api/?name=${hoveredProfile.username}&background=0ea5e9&color=fff&size=48`}
                  alt={hoveredProfile.username}
                  className="w-12 h-12 rounded-full border-2 border-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${hoveredProfile.username}&background=0ea5e9&color=fff&size=48`;
                  }}
                />
                <div>
                  <div className="text-white font-medium">@{hoveredProfile.username}</div>
                  {hoveredProfile.profile_name && (
                    <div className="text-gray-400 text-sm">{hoveredProfile.profile_name}</div>
                  )}
                </div>
              </div>
              
              {hoveredProfile.bio && (
                <div className="text-gray-300 text-sm mb-3">{hoveredProfile.bio}</div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-700 rounded-lg p-2">
                  <div className="text-gray-400">Followers</div>
                  <div className="text-white font-medium">{formatNumber(hoveredProfile.followers_count)}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-2">
                  <div className="text-gray-400">Posts</div>
                  <div className="text-white font-medium">{formatNumber(hoveredProfile.posts_count)}</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700">
                <a
                  href={`https://instagram.com/${hoveredProfile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center space-x-1"
                >
                  <span>View on Instagram</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
