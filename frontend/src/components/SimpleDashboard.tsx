import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Users,
  TrendingUp
} from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { formatNumber } from '../utils/format';
import { clsx } from 'clsx';
import { api } from '../services/api';

type SortField = 'followers_count' | 'following_count' | 'posts_count' | 'engagement_rate';
type SortOrder = 'asc' | 'desc';

const SimpleDashboard: React.FC = () => {
  const [sortField, setSortField] = useState<SortField>('followers_count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [newProfileInput, setNewProfileInput] = useState('');
  const [isScrapingProfile, setIsScrapingProfile] = useState(false);

  const { data: profiles, isLoading, refetch } = useProfiles();
  const [isAddingProfiles, setIsAddingProfiles] = useState(false);

  // Auto-refresh every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const addSampleProfiles = async () => {
    setIsAddingProfiles(true);
    try {
      const allUsernames = [
        'instagram', 'cristiano', 'selenagomez', 'therock', 'arianagrande',
        'kimkardashian', 'kyliejenner', 'leomessi', 'neymarjr', 'beyonce',
        'justinbieber', 'taylorswift', 'katyperry', 'nickiminaj'
      ];
      
      await api.scrapeProfiles({ usernames: allUsernames });
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error adding profiles:', error);
    } finally {
      setIsAddingProfiles(false);
    }
  };

  const addNewProfile = async () => {
    if (!newProfileInput.trim()) return;
    
    setIsScrapingProfile(true);
    try {
      await api.scrapeSingleProfile(newProfileInput.trim());
      setNewProfileInput('');
      refetch(); // Refresh the data
      alert(`Successfully added profile: ${newProfileInput}`);
    } catch (error: any) {
      console.error('Error adding profile:', error);
      alert(`Error: ${error.response?.data?.detail || 'Could not scrape profile'}`);
    } finally {
      setIsScrapingProfile(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedProfiles = React.useMemo(() => {
    if (!profiles) return [];

    let filtered = profiles.filter(profile => {
      const matchesSearch = profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (profile.profile_name && profile.profile_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMinFollowers = !minFollowers || profile.followers_count >= parseInt(minFollowers);
      return matchesSearch && matchesMinFollowers;
    });

    // Sort profiles
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [profiles, searchQuery, minFollowers, sortField, sortOrder]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const totalProfiles = profiles?.length || 0;
  const totalFollowers = profiles?.reduce((sum, profile) => sum + profile.followers_count, 0) || 0;

  return (
    <div className="min-h-screen bg-primary-background">
      {/* Header */}
      <header className="bg-primary-surface border-b border-primary-surfaceElevated">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Instagram Profile Analytics</h1>
              <p className="text-text-muted text-sm mt-1">
                Real-time rankings and analytics for Instagram public profiles
                <span className="ml-2 inline-flex items-center text-status-success text-xs">
                  <div className="w-2 h-2 bg-status-success rounded-full mr-1 animate-pulse"></div>
                  Auto-refresh: 30s
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={addSampleProfiles}
                disabled={isAddingProfiles}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                <span>{isAddingProfiles ? 'Adding...' : 'Load All Profiles'}</span>
              </button>
              <button
                onClick={() => refetch()}
                className="btn-primary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-cyan/20 rounded-lg">
                <Users className="w-6 h-6 text-primary-cyan" />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Total Profiles</p>
                <p className="text-text-primary text-2xl font-bold">{totalProfiles}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-status-success/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-status-success" />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Total Followers</p>
                <p className="text-text-primary text-2xl font-bold">{formatNumber(totalFollowers)}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-status-info/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-status-info" />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Verified Profiles</p>
                <p className="text-text-primary text-2xl font-bold">
                  {profiles?.filter(p => p.is_verified === 1).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Profile Section */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Add New Profile</h3>
              <p className="text-text-muted text-sm">Search and add any public Instagram profile</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Enter Instagram username (e.g., cristiano)"
                value={newProfileInput}
                onChange={(e) => setNewProfileInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNewProfile()}
                className="input pl-10 w-full"
                disabled={isScrapingProfile}
              />
            </div>
            <button
              onClick={addNewProfile}
              disabled={isScrapingProfile || !newProfileInput.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {isScrapingProfile ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Add Profile</span>
                </>
              )}
            </button>
          </div>
          
          <div className="mt-3 text-xs text-text-muted">
            💡 Tip: Enter just the username without @ symbol (e.g., "cristiano" not "@cristiano")
          </div>
        </div>

        {/* Main Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">Profile Rankings</h2>
              <p className="text-text-muted text-sm">Sort and filter Instagram profiles by various metrics</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                placeholder="Min followers"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                className="input pl-10 w-32"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-16 bg-primary-surfaceElevated rounded"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary-surfaceElevated">
                    <th className="text-left py-4 px-4 table-header">Rank</th>
                    <th className="text-left py-4 px-4 table-header">Profile</th>
                    <th 
                      className="text-left py-4 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                      onClick={() => handleSort('followers_count')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Followers</span>
                        {getSortIcon('followers_count')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-4 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                      onClick={() => handleSort('following_count')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Following</span>
                        {getSortIcon('following_count')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-4 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                      onClick={() => handleSort('posts_count')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Posts</span>
                        {getSortIcon('posts_count')}
                      </div>
                    </th>
                    <th 
                      className="text-left py-4 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                      onClick={() => handleSort('engagement_rate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Engagement</span>
                        {getSortIcon('engagement_rate')}
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedProfiles.map((profile, index) => (
                    <tr key={profile.id} className="border-b border-primary-surfaceElevated/50 hover:bg-primary-surface/50 transition-colors">
                      <td className="py-4 px-4 table-cell font-semibold text-primary-cyan">
                        #{index + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-cyan to-status-info rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-background">
                              {profile.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="table-cell font-medium">@{profile.username}</span>
                              {profile.is_verified === 1 && (
                                <CheckCircle className="w-4 h-4 text-primary-cyan" />
                              )}
                            </div>
                            {profile.profile_name && (
                              <p className="text-text-muted text-xs">{profile.profile_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 table-cell font-semibold">
                        {formatNumber(profile.followers_count)}
                      </td>
                      <td className="py-4 px-4 table-cell">
                        {formatNumber(profile.following_count)}
                      </td>
                      <td className="py-4 px-4 table-cell">
                        {formatNumber(profile.posts_count)}
                      </td>
                      <td className="py-4 px-4 table-cell">
                        <div className="flex items-center space-x-2">
                          <span className={clsx(
                            'font-semibold',
                            profile.engagement_rate > 5 ? 'text-status-success' :
                            profile.engagement_rate > 2 ? 'text-status-warning' :
                            'text-text-muted'
                          )}>
                            {profile.engagement_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <a 
                          href={`https://instagram.com/${profile.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-text-muted hover:text-primary-cyan transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredAndSortedProfiles.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-text-muted">No profiles found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
