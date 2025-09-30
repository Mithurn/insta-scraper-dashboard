import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

interface FollowerDistributionChartProps {
  selectedMetric: 'followers_count' | 'engagement_rate';
}

const FollowerDistributionChart: React.FC<FollowerDistributionChartProps> = ({ selectedMetric }) => {
  // Mock data for follower distribution
  const data = [
    { name: 'Cristiano Ronaldo', value: 25, followers: '615M', color: '#00d9ff' },
    { name: 'Lionel Messi', value: 20, followers: '492M', color: '#4a5f7f' },
    { name: 'Kylie Jenner', value: 15, followers: '399M', color: '#9b7dff' },
    { name: 'Selena Gomez', value: 12, followers: '429M', color: '#00ff88' },
    { name: 'The Rock', value: 10, followers: '397M', color: '#ff9500' },
    { name: 'Ariana Grande', value: 8, followers: '380M', color: '#ff3b5c' },
    { name: 'Kim Kardashian', value: 6, followers: '364M', color: '#ffd700' },
    { name: 'Others', value: 4, followers: '200M+', color: '#5a6b82' }
  ];

  const totalFollowers = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-primary-surfaceElevated border border-primary-surfaceElevated rounded-lg p-3 shadow-lg">
          <p className="text-text-primary text-sm font-medium">{data.name}</p>
          <p className="text-primary-cyan text-sm">
            {data.value}% of total market
          </p>
          <p className="text-text-muted text-sm">
            {data.followers} followers
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-3">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-muted text-xs font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card h-72">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            Follower Distribution
          </h3>
          <p className="text-text-muted text-sm">Market Share Analysis</p>
        </div>
        <div className="flex items-center space-x-2 text-status-success">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Top 8</span>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={65}
              paddingAngle={1}
              dataKey="value"
              stroke="#0f1419"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-primary-surfaceElevated">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary-cyan rounded-full"></div>
            <span>Total Market: {totalFollowers}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-status-success rounded-full"></div>
            <span>Top 3: {data.slice(0, 3).reduce((sum, item) => sum + item.value, 0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowerDistributionChart;
