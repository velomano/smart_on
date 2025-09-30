'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function BreadcrumbNavigation({ items, className = '' }: BreadcrumbNavigationProps) {
  const router = useRouter();

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.path && !item.isActive) {
      router.push(item.path);
    }
  };

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.isActive ? (
              <span className="text-gray-900 font-medium">{item.label}</span>
            ) : (
              <button
                onClick={() => handleItemClick(item)}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
