import React, { useState } from 'react';
import StatsCards from './StatsCards';
import ProfilesTable from './ProfilesTable';
import EngagementChart from './EngagementChart';
import FollowerDistributionChart from './FollowerDistributionChart';

const MainContent: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'followers_count' | 'engagement_rate'>('followers_count');

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {/* Stats Cards */}
      <StatsCards />
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Engagement Chart */}
        <div>
          <EngagementChart selectedMetric={selectedMetric} />
        </div>
        
        {/* Follower Distribution Chart */}
        <div>
          <FollowerDistributionChart selectedMetric={selectedMetric} />
        </div>
      </div>

      {/* Profiles Table */}
      <div className="w-full">
        <ProfilesTable 
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />
      </div>
    </div>
  );
};

export default MainContent;
