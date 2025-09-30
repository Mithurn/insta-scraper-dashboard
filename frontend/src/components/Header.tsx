import React, { useState } from 'react';
import { Menu, Search, Bell, User, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = ['Dashboard', 'Pages', 'Posts'];
  const activeNavItem = 'Dashboard';

  return (
    <header className="h-16 bg-primary-background border-b border-primary-surfaceElevated px-6 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-primary-surface rounded-lg transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="text-primary-cyan">DASHBOARD</span>
          <span className="text-text-muted">&gt;</span>
          <span className="text-text-muted">STATISTICS</span>
        </div>
      </div>

      {/* Center Navigation */}
      <nav className="flex items-center space-x-8">
        {navItems.map((item) => (
          <button
            key={item}
            className={clsx(
              'relative px-3 py-2 text-sm font-medium transition-all duration-200',
              item === activeNavItem
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            {item}
            {item === activeNavItem && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-cyan rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-primary-surface border border-primary-surfaceElevated rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent w-64"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-text-muted hover:text-text-primary hover:bg-primary-surface rounded-lg transition-all duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-status-error rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-cyan to-status-info rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">Admin</span>
            <span className="text-xs text-text-muted">UX Designer</span>
          </div>
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </div>
      </div>
    </header>
  );
};

export default Header;
