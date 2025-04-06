'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react'; // Using lucide-react for icons

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-full bg-white dark:bg-fitness-dark shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-semibold text-fitness-dark dark:text-white">Menu</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
          </div>
          <ul className="space-y-2 font-medium">
            <li>
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center p-2 text-fitness-dark rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                Home
              </Link>
            </li>
             <li>
              <Link
                href="/workout"
                 onClick={onClose}
                className="flex items-center p-2 text-fitness-dark rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                Workouts
              </Link>
            </li>
            <li>
              <Link
                href="/nutrition"
                 onClick={onClose}
                className="flex items-center p-2 text-fitness-dark rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                Nutrition
              </Link>
            </li>
            <li>
              <Link
                href="/form-check"
                onClick={onClose}
                className="flex items-center p-2 text-fitness-dark rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                 Form Check
              </Link>
            </li>
             <li>
              <Link
                href="/progress"
                onClick={onClose}
                className="flex items-center p-2 text-fitness-dark rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                Progress
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center p-2 text-fitness-dark rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                Settings
              </Link>
            </li>
          </ul>
          <div className="absolute bottom-4 left-4 right-4">
             <button className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
                Get Started
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
