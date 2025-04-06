'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Chat from '@/components/chat/Chat';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-4 overflow-hidden">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="mb-6">
              
            </div>
            
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <Chat />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
