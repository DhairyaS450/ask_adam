'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Chat from '@/components/chat/Chat';
import Sidebar from '@/components/layout/Sidebar';

export default function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 p-4 overflow-hidden pt-20 md:pt-4">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <Chat />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
