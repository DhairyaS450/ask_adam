import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
        
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
          <p><strong>Last Updated:</strong> [Date]</p>

          <p>Welcome to Ask ADAM!</p>
          
          <p>These terms and conditions outline the rules and regulations for the use of Ask ADAM's Application, located at [Your App URL/Access Point].</p>

          <p>By accessing this application we assume you accept these terms and conditions. Do not continue to use Ask ADAM if you do not agree to take all of the terms and conditions stated on this page.</p>

          <h2 className="text-xl font-semibold mt-4">Placeholder Content</h2>
          <p>This is placeholder text for the Terms of Service. The full legal document detailing user rights, responsibilities, limitations of liability, intellectual property, termination clauses, governing law, and other essential conditions will be added here.</p>
          
          <p>Please consult with a legal professional to draft the appropriate Terms of Service for your application.</p>
          
          {/* Add more placeholder sections as needed */}
          
        </div>

        <div className="mt-8">
          <Link href="/login-signup" className="text-primary hover:underline">
            &larr; Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
