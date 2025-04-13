'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

export default function OnboardingComplete() {
  const [userName, setUserName] = useState('User'); // Default to 'User'
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch user's name and primary goal to personalize the welcome
  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    const fetchData = async () => {
      if (user && isMounted) {
        setLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          let fetchedName = 'User'; // Default name
          let fetchedGoal = ''; // Default goal

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Safely access nested properties
            fetchedName = data?.preferences?.firstName || data?.name || 'User'; 
            fetchedGoal = data?.preferences?.primaryGoal || '';
            
            // Optional: Check if onboarding was actually marked complete
            // if (!data?.preferences?.onboardingComplete) {
            //   console.warn('Onboarding not marked complete, redirecting.');
            //   router.push('/onboarding/step-1');
            //   return; // Exit early
            // }
          } else {
            console.warn('User document not found for UID:', user.uid);
          }

          // Update state only if component is still mounted
          if (isMounted) {
             setUserName(fetchedName);
             setPrimaryGoal(fetchedGoal);
          }
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Keep default values if error occurs
        } finally {
            if (isMounted) {
                 setLoading(false);
            }
        }
      } else if (!user && isMounted) {
        // If no user is logged in when the component mounts
        console.warn('No user found on onboarding complete page.');
        setLoading(false);
        // Consider redirecting to login: router.push('/login-signup');
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Cleanup function to set isMounted to false
    };
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Basic Loading Spinner */} 
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 text-center">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-xl transform transition-all hover:scale-[1.01]">
        
        {/* Replace with ADAM logo/avatar later */}
        <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center text-4xl font-bold text-black mb-4 shadow-md">
          A
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {userName}! Your Setup is Complete.
        </h1>
        
        <p className="text-lg text-gray-700 dark:text-gray-300">
          I'm <span className="font-semibold text-primary">ADAM</span>, your AI-powered fitness assistant. I'm here to help you reach your goals by providing personalized workout plans, nutrition advice, and form feedback.
        </p>

        {/* Goal Confirmation */}
        {primaryGoal && (
          <p className="text-md text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            Based on your profile, your primary goal is to <span className="font-medium">{primaryGoal}</span>. We'll focus on that together!
          </p>
        )}

        <p className="text-md text-gray-700 dark:text-gray-300">
          Ready to get started?
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <button
            onClick={() => router.push('/')} // Go to main dashboard/chat
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
          >
            Go to Dashboard 
            <ArrowRightIcon className="w-5 h-5" />
          </button>
          {/* Optional: Button for first workout suggestion? */}
          <button
            onClick={() => { /* TODO: Trigger first workout suggestion in chat? */ }}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            See a Sample Workout
          </button>
        </div>
      </div>
    </div>
  );
}
