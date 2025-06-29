import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberPerformance, setMemberPerformance] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamError) throw teamError;
      setTeamMembers(teamData || []);
      
      // Fetch performance data for each team member
      const performanceData: Record<string, any> = {};
      
      // Get all leads to analyze performance
      const { data: allLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*');

      if (leadsError) {
        console.error('Error fetching leads for performance:', leadsError);
      }

      for (const member of teamData || []) {
        // Method 1: Try to find leads assigned to this team member by email
        const leadsByEmail = (allLeads || []).filter(lead => 
          lead.assigned_to === member.email || 
          lead.user_id === member.user_id
        );

        // Method 2: Try to find leads created by users with the same email as team member
        const { data: userLeads, error: userLeadsError } = await supabase
          .from('leads')
          .select(`
            *,
            profiles!inner(email)
          `)
          .eq('profiles.email', member.email);

        if (userLeadsError) {
          console.log('Could not fetch user leads for', member.email, userLeadsError);
        }

        // Method 3: Direct query by team member assignment
        const { data: assignedLeads, error: assignedError } = await supabase
          .from('leads')
          .select('*')
          .eq('assigned_team_member_id', member.id);

        if (assignedError) {
          console.log('Could not fetch assigned leads for', member.id, assignedError);
        }

        // Combine all methods to get the most comprehensive view
        const allMemberLeads = [
          ...leadsByEmail,
          ...(userLeads || []),
          ...(assignedLeads || [])
        ];

        // Remove duplicates based on lead ID
        const uniqueLeads = allMemberLeads.filter((lead, index, self) => 
          index === self.findIndex(l => l.id === lead.id)
        );

        console.log(`Performance data for ${member.name}:`, {
          email: member.email,
          leadsByEmail: leadsByEmail.length,
          userLeads: (userLeads || []).length,
          assignedLeads: (assignedLeads || []).length,
          uniqueLeads: uniqueLeads.length,
          convertedLeads: uniqueLeads.filter(lead => lead.status === 'Converted').length
        });

        performanceData[member.id] = {
          leadsAssigned: uniqueLeads.length,
          leadsConverted: uniqueLeads.filter(lead => lead.status === 'Converted').length,
          leadsNew: uniqueLeads.filter(lead => lead.status === 'New').length,
          leadsContacted: uniqueLeads.filter(lead => lead.status === 'Contacted').length,
          leadsFollowUp: uniqueLeads.filter(lead => lead.status === 'Follow-Up').length,
          leadsLost: uniqueLeads.filter(lead => lead.status === 'Lost').length,
          totalRevenue: uniqueLeads
            .filter(lead => lead.status === 'Converted' && lead.value)
            .reduce((sum, lead) => sum + (lead.value || 0), 0),
          tasksCompleted: 0, // Placeholder for tasks
          tasksTotal: 0 // Placeholder for tasks
        };
      }
      
      setMemberPerformance(performanceData);
      console.log('Final performance data:', performanceData);
      
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for leads to update performance metrics
  useEffect(() => {
    if (!user) return;

    fetchTeamMembers();

    // Subscribe to real-time changes on leads to update performance
    const leadsChannel = supabase
      .channel('team-performance-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Lead change detected for team performance:', payload);
          // Refetch team members and performance data when leads change
          setTimeout(() => {
            fetchTeamMembers();
          }, 100);
        }
      )
      .subscribe();

    // Also subscribe to team_members changes
    const teamChannel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members'
        },
        (payload) => {
          console.log('Team member change detected:', payload);
          setTimeout(() => {
            fetchTeamMembers();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(teamChannel);
    };
  }, [user]);

  const deleteTeamMember = async (memberId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      toast({
        title: "Success",
        description: "Team member deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: "Failed to delete team member",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    teamMembers,
    memberPerformance,
    loading,
    refetch: fetchTeamMembers,
    deleteTeamMember,
  };
};