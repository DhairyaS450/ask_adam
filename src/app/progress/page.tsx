'use client';

import ComingSoon from '@/components/common/ComingSoon';
import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const ProgressPage: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 overflow-y-auto pt-20 md:pt-4">
          <ComingSoon />
        </main>
      </div>
    </div>
  );
};

export default ProgressPage;
