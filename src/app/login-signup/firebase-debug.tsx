'use client';

import React, { useEffect, useState } from 'react';
import { firebaseApp } from '@/lib/firebase';

export default function FirebaseDebugger() {
  const [configStatus, setConfigStatus] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    // Check environment variables without exposing actual values
    const envVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
    ];
    
    const status: Record<string, boolean> = {};
    
    envVars.forEach(varName => {
      status[varName] = !!process.env[varName];
    });
    
    // Check if Firebase app is initialized
    status['firebaseInitialized'] = !!firebaseApp;
    
    setConfigStatus(status);
  }, []);
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Firebase Configuration Status</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        This component helps debug Firebase configuration issues.
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border px-4 py-2 text-left">Configuration Item</th>
              <th className="border px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(configStatus).map(([key, value]) => (
              <tr key={key} className="border-b">
                <td className="border px-4 py-2">{key}</td>
                <td className="border px-4 py-2">
                  {value ? (
                    <span className="text-green-500">✓ Available</span>
                  ) : (
                    <span className="text-red-500">✗ Missing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Troubleshooting Steps:</h3>
        <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
          <li>Verify you have created a <code>.env.local</code> file with Firebase configuration</li>
          <li>Make sure all values in .env.local match your Firebase console settings</li>
          <li>Restart your Next.js development server to load new environment variables</li>
          <li>Check if your Firebase project has Authentication enabled in Firebase Console</li>
          <li>Ensure Email/Password authentication is enabled in Firebase Console</li>
        </ol>
      </div>
    </div>
  );
} 