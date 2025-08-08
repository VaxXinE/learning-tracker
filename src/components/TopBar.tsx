'use client';
import { useAuth } from '@/components/AuthProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

export function TopBar() {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Welcome{user ? `, ${user.email}` : ''}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user && (
          <button 
            className="btn btn-secondary"
            onClick={logout}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
