import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EngagementChartProps {
  selectedMetric: 'followers_count' | 'engagement_rate';
}

const EngagementChart: React.FC<EngagementChartProps> = ({ selectedMetric }) => {
  // Mock data for demonstration - in a real app, this would come from historical data
  const data = [
    { day: 'Mon', value: 1200000, secondary: 800000 },
    { day: 'Tue', value: 1350000, secondary: 950000 },
    { day: 'Wed', value: 1180000, secondary: 780000 },
    { day: 'Thu', value: 1420000, secondary: 1100000 },
    { day: 'Fri', value: 1580000, secondary: 1250000 },
    { day: 'Sat', value: 1690000, secondary: 1380000 },
    { day: 'Sun', value: 1450000, secondary: 1150000 },
  ];

  const formatValue = (value: number) => {
    if (selectedMetric === 'followers_count') {
      return (value / 1000000).toFixed(1) + 'M';
    }
    return value.toFixed(1) + '%';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary-surfaceElevated border border-primary-surfaceElevated rounded-lg p-3 shadow-lg">
          <p className="text-text-primary text-sm font-medium">{label}</p>
          <p className="text-primary-cyan text-sm">
            {selectedMetric === 'followers_count' ? 'Followers' : 'Engagement'}: {formatValue(payload[0].value)}
          </p>
          <p className="text-text-muted text-sm">
            Previous: {formatValue(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card h-72">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {selectedMetric === 'followers_count' ? 'Followers Growth' : 'Engagement Trends'}
          </h3>
          <p className="text-text-muted text-sm">Last 7 days</p>
        </div>
        <div className="flex items-center space-x-2 text-status-success">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+12.5%</span>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00d9ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a5f7f" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#4a5f7f" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#243447" opacity={0.3} />
            <XAxis 
              dataKey="day" 
              stroke="#5a6b82"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#5a6b82"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00d9ff"
              strokeWidth={3}
              dot={{ fill: '#00d9ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#00d9ff', strokeWidth: 2, fill: '#0f1419' }}
            />
            <Line
              type="monotone"
              dataKey="secondary"
              stroke="#4a5f7f"
              strokeWidth={2}
              dot={{ fill: '#4a5f7f', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#4a5f7f', strokeWidth: 2, fill: '#0f1419' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-primary-surfaceElevated">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary-cyan rounded-full"></div>
          <span className="text-text-muted text-sm">This Week</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-chart-secondary rounded-full"></div>
          <span className="text-text-muted text-sm">Last Week</span>
        </div>
      </div>
    </div>
  );
};

export default EngagementChart;
