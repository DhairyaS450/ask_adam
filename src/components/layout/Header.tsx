'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  
  return (
    <header className="w-full p-4 bg-white dark:bg-black text-gray-800 dark:text-white shadow-md fixed top-0 left-0 right-0 z-10 md:relative">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-10 h-10 overflow-hidden rounded-full">
            <Image
              src="/images/logo-512x512.png"
              alt="Ask Adam Logo"
              width={40}
              height={40}
              priority
            />
          </div>
          <span className="font-bold text-xl">Ask Adam</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-800 dark:text-white hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/workout" className="text-gray-800 dark:text-white hover:text-primary transition-colors">
            Workouts
          </Link>
          <Link href="/nutrition" className="text-gray-800 dark:text-white hover:text-primary transition-colors">
            Nutrition
          </Link>
          <Link href="/form-check" className="text-gray-800 dark:text-white hover:text-primary transition-colors">
            Form Check
          </Link>
          <Link href="/progress" className="text-gray-800 dark:text-white hover:text-primary transition-colors">
            Progress
          </Link>
          <Link href="/settings" className="text-gray-800 dark:text-white hover:text-primary transition-colors">
            Settings
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
              <button onClick={() => signOut(auth)} className="text-gray-800 dark:text-white hover:text-primary transition-colors">
                {"Logout"}
              </button>
            </button>
          ) : (
            <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
              <Link href="/login-signup" className="text-gray-800 dark:text-white hover:text-primary transition-colors">
                {"Login/Signup"}
              </Link>
            </button>
          )}
        </div>

        <div className="md:hidden">
          <button
            onClick={onMenuClick}
            className="text-fitness-dark dark:text-white focus:outline-none"
            aria-label="Open sidebar menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
