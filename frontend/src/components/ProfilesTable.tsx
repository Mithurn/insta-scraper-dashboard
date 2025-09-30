import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { formatNumber } from '../utils/format';
import { clsx } from 'clsx';

interface ProfilesTableProps {
  selectedMetric: 'followers_count' | 'engagement_rate';
  onMetricChange: (metric: 'followers_count' | 'engagement_rate') => void;
}

type SortField = 'followers_count' | 'following_count' | 'posts_count' | 'engagement_rate';
type SortOrder = 'asc' | 'desc';

const ProfilesTable: React.FC<ProfilesTableProps> = ({ selectedMetric, onMetricChange }) => {
  const [sortField, setSortField] = useState<SortField>(selectedMetric);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [minFollowers, setMinFollowers] = useState('');

  const { data: profiles, isLoading, refetch } = useProfiles();

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

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-primary-surfaceElevated rounded w-48"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 bg-primary-surfaceElevated rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-1">Profile Rankings</h2>
          <p className="text-text-muted text-sm">Real-time Instagram profile analytics</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-surfaceElevated">
              <th className="text-left py-3 px-4 table-header">Rank</th>
              <th className="text-left py-3 px-4 table-header">Profile</th>
              <th 
                className="text-left py-3 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                onClick={() => handleSort('followers_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Followers</span>
                  {getSortIcon('followers_count')}
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                onClick={() => handleSort('following_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Following</span>
                  {getSortIcon('following_count')}
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                onClick={() => handleSort('posts_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Posts</span>
                  {getSortIcon('posts_count')}
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 table-header cursor-pointer hover:text-primary-cyan transition-colors"
                onClick={() => handleSort('engagement_rate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Engagement</span>
                  {getSortIcon('engagement_rate')}
                </div>
              </th>
              <th className="text-left py-3 px-4 table-header">Actions</th>
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
                  <button className="p-1 text-text-muted hover:text-primary-cyan transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No profiles found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default ProfilesTable;
