'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import FormCheckUI from '@/components/form-check/FormCheckUI';

export default function FormCheckPage() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              Workout Form Check (videos are not saved)
            </h1>
            <FormCheckUI />
          </div>
        </main>
      </div>
    </div>
  );
}
