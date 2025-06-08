import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  LifeBuoy, 
  MessageSquare,
  Lightbulb,
  Star,
  Skull,
  ShieldCheck,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../contexts/SubscriptionContext';
import { auth } from '../lib/firebase';
import { useDarkMode } from '../contexts/DarkModeContext';

interface UserMenuProps {
  userName: string;
  onLogout: () => void;
}

export default function UserMenu({ userName, onLogout }: UserMenuProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { plan } = useSubscription();
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    const checkAdminStatus = () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setIsAdmin(currentUser.uid === 'yOFRGcwpmeXLgx9cjpzOmU8M5AH2');
      }
    };

    checkAdminStatus();
    return auth.onAuthStateChanged(checkAdminStatus);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const renderPlanIcon = () => {
    switch (plan) {
      case 'commited':
        return <Star className="w-4 h-4" />;
      case 'locked-in':
        return (
          <img 
            src="https://evlo-malik.github.io/uni-logos/goat.png" 
            alt="GOAT"
            className="w-[15px] h-[15px] object-contain filter grayscale brightness-50" // Reduced size slightly
          />
        );
      default:
        return <Skull className="w-4 h-4" />;
    }
  };

  const getPlanDisplay = () => {
    switch (plan) {
      case 'commited':
        return t('userMenu.planStatus.committedMember');
      case 'locked-in':
        return t('userMenu.planStatus.lockedInMember');
      default:
        return t('userMenu.planStatus.cookedMember');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
          {userName?.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{userName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="flex items-center">
              {renderPlanIcon()}
            </span>
            {getPlanDisplay()}
          </p>
        </div>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
          {/* User Info */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{userName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span className="flex items-center">
                {renderPlanIcon()}
              </span>
              {getPlanDisplay()}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/updates"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {t('userMenu.updates')}
            </Link>

            {/* <Link
              to="/profile"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <User className="h-4 w-4" />
              {t('userMenu.profile')}
            </Link> */}

            {/* <Link
              to="/pricing"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Star className="h-4 w-4" />
              {t('userMenu.upgradePlan')}
            </Link> */}

            <Link
              to="/support"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <LifeBuoy className="h-4 w-4" />
              {t('userMenu.support')}
            </Link>

            <Link
              to="/feedback"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {t('userMenu.feedback')}
            </Link>

            <Link
              to="/feature-request"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              {t('userMenu.featureRequest')}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                {t('userMenu.adminPortal')}
              </Link>
            )}

            <button
              onClick={() => {
                toggleDarkMode();
                setShowDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4" />
                  {t('userMenu.lightMode')}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  {t('userMenu.darkMode')}
                </>
              )}
            </button>

            <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

            <button
              onClick={() => {
                setShowDropdown(false);
                onLogout();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              {t('userMenu.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
