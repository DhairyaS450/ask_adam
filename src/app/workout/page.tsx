'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function WorkoutsPage() {
  // const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // TODO: Replace with actual workouts
  const workouts = [
    ["Bench Press", 3, 10],
    ["Squats", 4, 8],
    ["Deadlift", 3, 5],
    ["Overhead Press", 3, 8],
    ["Pullups", 3, 8],
    ["Deadlift", 3, 5],
  ]

  const handleEdit = (index: number) => {
    // TODO: Implement edit functionality
    console.log(`Editing workout at index ${index}`);
  };

  const handleDelete = (index: number) => {
    // TODO: Implement delete functionality
    console.log(`Deleting workout at index ${index}`);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 overflow-hidden pt-20 md:pt-4 padding-50">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Workouts</h1>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Workout</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reps</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {workouts.map((workout, index) => (
                  <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{workout[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{workout[1]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{workout[2]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleEdit(index)}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button
                          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleDelete(index)}
                        >
                          <TrashIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}


