
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AuthButton = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      toast({
        title: "Signing out...",
        description: "Please wait",
      });
      await signOut();
    } catch (error) {
      toast({
        title: "Sign out completed",
        description: "You have been signed out",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex items-center gap-2 text-slate-300">
        <User className="w-4 h-4" />
        <span className="text-sm">{user.email}</span>
      </div>
      <Button
        onClick={handleSignOut}
        variant="ghost"
        size="sm"
        className="text-slate-400 hover:text-white"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
};
