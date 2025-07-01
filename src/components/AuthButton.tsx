
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown, BarChart3, Briefcase, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AuthButton = () => {
  const { user, teamMember, signOut } = useAuth();
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
    }
  };

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'sales_manager': return <BarChart3 className="w-4 h-4 text-blue-400" />;
      case 'sales_associate': return <Briefcase className="w-4 h-4 text-green-400" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'text-purple-400';
      case 'sales_manager': return 'text-blue-400';
      case 'sales_associate': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const getRoleDisplayName = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'sales_manager': return 'Sales Manager';
      case 'sales_associate': return 'Sales Associate';
      default: return 'Loading...';
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 border-t border-slate-800">
      <div className="flex items-center gap-2 text-slate-300">
        {getRoleIcon(teamMember?.role)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{teamMember?.name || user.email}</div>
          <div className={`text-xs ${getRoleColor(teamMember?.role)} flex items-center gap-1`}>
            <Shield className="w-3 h-3" />
            {getRoleDisplayName(teamMember?.role)}
          </div>
          <div className="text-xs text-slate-500">
            Team Hierarchy System
          </div>
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
