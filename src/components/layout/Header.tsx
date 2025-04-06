import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="w-full p-4 bg-white dark:bg-fitness-dark text-fitness-dark dark:text-white shadow-md">
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
          <Link href="/" className="text-fitness-dark dark:text-white hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/workout" className="text-fitness-dark dark:text-white hover:text-primary transition-colors">
            Workouts
          </Link>
          <Link href="/nutrition" className="text-fitness-dark dark:text-white hover:text-primary transition-colors">
            Nutrition
          </Link>
          <Link href="/form-check" className="text-fitness-dark dark:text-white hover:text-primary transition-colors">
            Form Check
          </Link>
          <Link href="/progress" className="text-fitness-dark dark:text-white hover:text-primary transition-colors">
            Progress
          </Link>
          <Link href="/settings" className="text-fitness-dark dark:text-white hover:text-primary transition-colors">
            Settings
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
