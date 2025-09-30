import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MainContent from './MainContent';
import RightSidebar from './RightSidebar';

const Dashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-primary-background">
      {/* Left Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Content */}
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>
          
          {/* Right Sidebar */}
          <div className="w-80 bg-primary-background border-l border-primary-surfaceElevated">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
