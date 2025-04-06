import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  HomeIcon, 
  ClipboardDocumentListIcon,
  CameraIcon,
  BookOpenIcon,
  ChartBarIcon, 
  Cog6ToothIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Workout Plans', href: '/workout', icon: ClipboardDocumentListIcon },
    { name: 'Nutrition', href: '/nutrition', icon: BookOpenIcon },
    { name: 'Form Check', href: '/form-check', icon: VideoCameraIcon },
    { name: 'Progress', href: '/progress', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="h-screen w-16 lg:w-64 bg-fitness-dark text-white fixed left-0 top-0 overflow-y-auto transition-all duration-300 ease-in-out z-10">
      <div className="p-4 flex flex-col h-full">
        <div className="mb-6 lg:flex items-center justify-center lg:justify-start hidden">
          <span className="font-bold text-xl text-white">Ask Adam</span>
        </div>
        
        <nav className="flex-1 space-y-2 mt-10">
          {navigation.map((item) => (
            <SidebarLink key={item.name} icon={<item.icon className="w-6 h-6" />} label={item.name} href={item.href} />
          ))}
        </nav>
        
        <div className="mt-auto pb-4">
        </div>
      </div>
    </aside>
  );
};

const SidebarLink = ({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) => {
  return (
    <Link href={href} className="flex items-center p-2 rounded-lg hover:bg-primary transition-colors duration-200 text-white">
      <div className="flex items-center justify-center">{icon}</div>
      <span className="hidden lg:block ml-3">{label}</span>
    </Link>
  );
};

export default Sidebar;
