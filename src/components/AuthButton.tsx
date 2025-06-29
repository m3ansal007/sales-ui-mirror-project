import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown, BarChart3, Briefcase, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AuthButton = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      console.log('AuthButton: Starting sign out...');
      
      toast({
        title: "Signing out...",
        description: "Please wait",
      });
      
      await signOut();
      
    } catch (error) {
      console.error('AuthButton: Sign out error:', error);
      
      toast({
        title: "Sign out completed",
        description: "You have been signed out",
      });
      
      // Force redirect as fallback
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'Admin': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'Sales Manager': return <BarChart3 className="w-4 h-4 text-blue-400" />;
      case 'Sales Associate': return <Briefcase className="w-4 h-4 text-green-400" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'Admin': return 'text-purple-400';
      case 'Sales Manager': return 'text-blue-400';
      case 'Sales Associate': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const getAuthorizedRole = (user: any) => {
    return user?.user_metadata?.authorized_role || user?.user_metadata?.role;
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 border-t border-slate-800">
      <div className="flex items-center gap-2 text-slate-300">
        {getRoleIcon(userRole)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{user.email}</div>
          <div className={`text-xs ${getRoleColor(userRole)} flex items-center gap-1`}>
            <Shield className="w-3 h-3" />
            {userRole || 'Sales Associate'}
          </div>
          {getAuthorizedRole() && (
            <div className="text-xs text-slate-500">
              Authorized: {getAuthorizedRole()}
            </div>
          )}
        </div>
      </div>
      <Button
        onClick={handleSignOut}
        variant="ghost"
        size="sm"
        className="text-slate-400 hover:text-white justify-start px-2"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

const getRoleIcon = (role: string | null) => {
  switch (role) {
    case 'Admin': return <Crown className="w-4 h-4 text-purple-400" />;
    case 'Sales Manager': return <BarChart3 className="w-4 h-4 text-blue-400" />;
    case 'Sales Associate': return <Briefcase className="w-4 h-4 text-green-400" />;
    default: return <User className="w-4 h-4" />;
  }
};

const getRoleColor = (role: string | null) => {
  switch (role) {
    case 'Admin': return 'text-purple-400';
    case 'Sales Manager': return 'text-blue-400';
    case 'Sales Associate': return 'text-green-400';
    default: return 'text-slate-400';
  }
};

const getAuthorizedRole = (user: any) => {
  return user?.user_metadata?.authorized_role || user?.user_metadata?.role;
};
