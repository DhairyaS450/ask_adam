import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
        
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
          <p><strong>Last Updated:</strong> [Date]</p>

          <p>Your privacy is important to us. It is Ask ADAM's policy to respect your privacy regarding any information we may collect from you across our application.</p>

          <h2 className="text-xl font-semibold mt-4">Information We Collect</h2>
          <p>This section will detail the types of personal information collected (e.g., name, email, fitness data, usage data), how it's collected (e.g., user input, analytics), and the purpose of collection (e.g., personalization, app functionality, analytics).</p>
          
          <h2 className="text-xl font-semibold mt-4">How We Use Information</h2>
          <p>Details on how the collected information is used, including service provision, personalization, communication, analytics, and legal compliance.</p>

          <h2 className="text-xl font-semibold mt-4">Data Storage and Security</h2>
          <p>Information about where data is stored (e.g., Firebase Firestore), the security measures in place to protect user data, and data retention policies.</p>

          <h2 className="text-xl font-semibold mt-4">Third-Party Services</h2>
          <p>Disclosure of any third-party services used (e.g., Firebase, Google Gemini API) and links to their privacy policies.</p>
          
          <h2 className="text-xl font-semibold mt-4">Your Rights</h2>
          <p>Explanation of user rights regarding their personal data (e.g., access, correction, deletion) and how they can exercise these rights.</p>

          <h2 className="text-xl font-semibold mt-4">Placeholder Content</h2>
          <p>This is placeholder text for the Privacy Policy. The full legal document compliant with relevant regulations (like GDPR, CCPA, etc.) will be added here.</p>

          <p>Please consult with a legal professional to draft the appropriate Privacy Policy for your application and target audience.</p>

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
