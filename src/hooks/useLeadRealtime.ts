
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Lead } from '@/types/leads';

interface UseLeadRealtimeProps {
  user: User | null;
  userRole: string | null;
  onLeadAdded: (lead: Lead) => void;
  onLeadUpdated: () => void;
  onLeadDeleted: (id: string) => void;
  toast: (options: any) => void;
}

export const useLeadRealtime = ({ 
  user, 
  userRole, 
  onLeadAdded, 
  onLeadUpdated, 
  onLeadDeleted, 
  toast 
}: UseLeadRealtimeProps) => {
  useEffect(() => {
    if (!user || !userRole) return;

    console.log('Setting up leads real-time subscription...');

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Real-time: New lead added:', payload.new);
          const newLead = payload.new as Lead;
          
          // For sales associates, check if it's their lead or assigned to them
          if (userRole?.toLowerCase() !== 'admin' && userRole?.toLowerCase() !== 'sales_manager') {
            onLeadUpdated(); // Refresh to properly categorize
          } else {
            onLeadAdded(newLead);
          }
          
          toast({
            title: "New Lead Added",
            description: `${newLead.name} has been added to your leads`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Real-time: Lead updated:', payload.new);
          onLeadUpdated(); // Always refresh on update to ensure proper categorization
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Real-time: Lead deleted:', payload.old);
          onLeadDeleted(payload.old.id);
        }
      )
      .subscribe((status) => {
        console.log('Leads subscription status:', status);
      });

    return () => {
      console.log('Cleaning up leads subscription...');
      supabase.removeChannel(channel);
    };
  }, [user, userRole, onLeadAdded, onLeadUpdated, onLeadDeleted, toast]);
};
