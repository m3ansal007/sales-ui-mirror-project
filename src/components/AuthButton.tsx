
import React from 'react';
import { UserMenu } from '@/components/UserMenu';

// This component is now just a wrapper for UserMenu to maintain compatibility
export const AuthButton = () => {
  return <UserMenu />;
};
