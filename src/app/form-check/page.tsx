'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import FormCheckUI from '@/components/form-check/FormCheckUI';
import Sidebar from '@/components/layout/Sidebar';

export default function FormCheckPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 p-4 overflow-hidden pt-20 md:pt-4">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-fitness-dark dark:text-white">AI Form Check</h1>
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <FormCheckUI />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
