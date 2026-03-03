'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faChartLine, faMicroscope, faMagnifyingGlass, faCog, faSitemap, faBrain } from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      icon: <FontAwesomeIcon icon={faChartLine} />,
      label: 'Sites Overview',
      href: '/overview',
    },
    {
      icon: <FontAwesomeIcon icon={faChartBar} />,
      label: 'Traffic Performance',
      href: '/',
    },
    {
      icon: <FontAwesomeIcon icon={faMicroscope} />,
      label: 'Correlation Matrix',
      href: '/performance',
    },
    {
      icon: <FontAwesomeIcon icon={faBrain} />,
      label: 'Traffic Insights',
      href: '/traffic-insights',
    },
    {
      icon: <FontAwesomeIcon icon={faMagnifyingGlass} />,
      label: 'URL Inspection',
      href: '/url-inspection',
    },
    {
      icon: <FontAwesomeIcon icon={faSitemap} />,
      label: 'Sitemap',
      href: '/sitemap',
    },
    {
      icon: <FontAwesomeIcon icon={faCog} />,
      label: 'Settings',
      href: '/settings',
    }
  ];

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900">GSC Dashboard</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="w-5 h-5">{item.icon}</span>
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 