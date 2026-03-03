import React from 'react';
import Card from '../ui/card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart, LayoutDashboard, Table, Settings, HelpCircle } from 'lucide-react';

const sidebarItems = [
  { label: 'Sites Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Traffic Performance', href: '/', icon: BarChart },
  { label: 'Correlation Matrix', href: '/performance', icon: Table },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  return (
    <Card className="h-full w-full p-4 flex flex-col gap-2 shadow-none border-r border-gray-200">
      <div className="flex flex-col gap-1">
        {sidebarItems.map((item) => {
          const active = pathname === item.href || (item.href === '/' && pathname === '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} legacyBehavior passHref>
              <a className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <Icon size={18} className="mr-2" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default Sidebar; 