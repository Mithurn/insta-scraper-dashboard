import React from 'react';
import { Clock, User, TrendingUp } from 'lucide-react';

const RightSidebar: React.FC = () => {
  const activities = [
    { user: 'System', action: 'Updated @cristiano profile data', time: 'Just now' },
    { user: 'Admin', action: 'Added new profile @selenagomez', time: '5 minutes ago' },
    { user: 'System', action: 'Completed scheduled scraping', time: '1 hour ago' },
    { user: 'Admin', action: 'Updated @therock engagement data', time: '2 hours ago' },
  ];

  const contacts = [
    { name: 'Cristiano Ronaldo', status: 'online' },
    { name: 'Selena Gomez', status: 'offline' },
    { name: 'Dwayne Johnson', status: 'online' },
    { name: 'Ariana Grande', status: 'online' },
    { name: 'Kim Kardashian', status: 'offline' },
    { name: 'Kylie Jenner', status: 'online' },
  ];

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Activities */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary-cyan" />
          <span>Recent Activities</span>
        </h3>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-cyan to-status-info rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium">{activity.user}</p>
                <p className="text-text-secondary text-xs">{activity.action}</p>
                <p className="text-text-muted text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Profiles */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary-cyan" />
          <span>Top Profiles</span>
        </h3>
        <div className="space-y-3">
          {contacts.map((contact, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-cyan to-status-info rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-background">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-primary-background ${
                  contact.status === 'online' ? 'bg-status-success' : 'bg-text-muted'
                }`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{contact.name}</p>
                <p className="text-text-muted text-xs">@{contact.name.toLowerCase().replace(' ', '')}</p>
              </div>
              <div className="text-text-muted text-xs">#{index + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">System Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Scraper Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-success rounded-full pulse-live"></div>
              <span className="text-status-success text-sm font-medium">Active</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Last Update</span>
            <span className="text-text-primary text-sm">2 min ago</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Profiles Tracked</span>
            <span className="text-text-primary text-sm">12</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">API Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-success rounded-full"></div>
              <span className="text-status-success text-sm font-medium">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
