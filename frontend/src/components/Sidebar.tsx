import React from 'react';
import { 
  Grid3X3, 
  Edit, 
  Home, 
  TrendingUp, 
  Clock,
  MessageCircle,
  Settings
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const sidebarItems = [
    { icon: Grid3X3, label: 'Dashboard', active: true },
    { icon: Edit, label: 'Analytics', active: false },
    { icon: Home, label: 'Profiles', active: false },
    { icon: TrendingUp, label: 'Trends', active: false },
    { icon: Clock, label: 'History', active: false },
  ];

  const bottomItems = [
    { icon: MessageCircle, label: 'Support', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <div className={clsx(
      'bg-primary-background border-r border-primary-surfaceElevated transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-20'
    )}>
      {/* Logo/Brand */}
      <div className="flex items-center justify-center h-16 border-b border-primary-surfaceElevated">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-cyan to-status-info rounded-lg flex items-center justify-center">
          <Grid3X3 className="w-4 h-4 text-primary-background" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            className={clsx(
              'w-full h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative',
              item.active 
                ? 'bg-primary-surfaceElevated text-primary-cyan shadow-glow' 
                : 'text-text-muted hover:text-text-primary hover:bg-primary-surface'
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {item.active && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-cyan rounded-l-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <nav className="px-2 py-4 space-y-2 border-t border-primary-surfaceElevated">
        {bottomItems.map((item, index) => (
          <button
            key={index}
            className="w-full h-12 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-primary-surface transition-all duration-200"
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
