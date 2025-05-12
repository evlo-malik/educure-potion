import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
    >
      {isDarkMode ? (
        <>
          <Sun size={16} /> Light Mode
        </>
      ) : (
        <>
          <Moon size={16} /> Dark Mode
        </>
      )}
    </button>
  );
} 