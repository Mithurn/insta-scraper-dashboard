import React from 'react';
import { Eye, Crosshair, UserPlus, Users, TrendingUp } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { formatNumber } from '../utils/format';

const StatsCards: React.FC = () => {
  const { data: profiles, isLoading } = useProfiles();

  const stats = React.useMemo(() => {
    if (!profiles || profiles.length === 0) {
      return {
        totalViews: 0,
        totalVisits: 0,
        newUsers: 0,
        activeUsers: 0,
        viewsChange: 0,
        visitsChange: 0,
        usersChange: 0,
        activeChange: 0
      };
    }

    const totalFollowers = profiles.reduce((sum, profile) => sum + profile.followers_count, 0);
    const totalFollowing = profiles.reduce((sum, profile) => sum + profile.following_count, 0);
    // const totalPosts = profiles.reduce((sum, profile) => sum + profile.posts_count, 0);
    // const avgEngagement = profiles.reduce((sum, profile) => sum + profile.engagement_rate, 0) / profiles.length;

    // Simulate some growth data (in a real app, this would come from historical data)
    const viewsChange = 11.01;
    const visitsChange = 25.0;
    const usersChange = 5.0;
    const activeChange = 16.0;

    return {
      totalViews: totalFollowers * 1000, // Estimated views based on followers
      totalVisits: totalFollowers,
      newUsers: Math.floor(totalFollowing / 100),
      activeUsers: Math.floor(totalFollowers / 1000),
      viewsChange,
      visitsChange,
      usersChange,
      activeChange
    };
  }, [profiles]);

  const cards = [
    {
      title: 'Total Views',
      value: formatNumber(stats.totalViews),
      change: `+${stats.viewsChange.toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: Eye,
      iconColor: '#ffd700'
    },
    {
      title: 'Total Followers',
      value: formatNumber(stats.totalVisits),
      change: `+${stats.visitsChange.toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: Crosshair,
      iconColor: '#9b7dff'
    },
    {
      title: 'New Profiles',
      value: stats.newUsers.toString(),
      change: `+${stats.usersChange.toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: UserPlus,
      iconColor: '#ff3b5c'
    },
    {
      title: 'Active Profiles',
      value: stats.activeUsers.toString(),
      change: `+${stats.activeChange.toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: Users,
      iconColor: '#00ff88'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="h-4 bg-primary-surfaceElevated rounded w-20 mb-2"></div>
            <div className="h-8 bg-primary-surfaceElevated rounded w-32 mb-2"></div>
            <div className="h-3 bg-primary-surfaceElevated rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 animate-fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-1">{card.title}</p>
              <p className="text-text-primary text-3xl font-bold">{card.value}</p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${card.iconColor}20` }}>
              <card.icon className="w-5 h-5" style={{ color: card.iconColor }} />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              card.changeType === 'positive' ? 'text-status-success' : 'text-status-error'
            }`}>
              {card.change}
            </span>
            <TrendingUp className="w-3 h-3 text-status-success" />
            <span className="text-text-muted text-xs">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
