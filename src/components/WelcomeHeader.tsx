
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const WelcomeHeader = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">
        {getGreeting()}, {getUserName()}!
      </h1>
      <p className="text-slate-400">
        Here's what's happening with your leads today
      </p>
    </div>
  );
};
