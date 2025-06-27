
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  hire_date: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TeamMemberPerformance {
  leadsAssigned: number;
  leadsConverted: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberPerformance, setMemberPerformance] = useState<Record<string, TeamMemberPerformance>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
      
      // Fetch performance data for each team member
      if (data && data.length > 0) {
        await fetchPerformanceData(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async (members: TeamMember[]) => {
    const performanceData: Record<string, TeamMemberPerformance> = {};

    for (const member of members) {
      try {
        // Fetch leads assigned to this team member
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('status')
          .eq('assigned_team_member_id', member.id);

        if (leadsError) throw leadsError;

        const leadsAssigned = leadsData?.length || 0;
        const leadsConverted = leadsData?.filter(lead => 
          lead.status === 'Converted' || lead.status === 'Won'
        ).length || 0;

        // Fetch tasks assigned to this team member
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('status')
          .eq('user_id', user.id); // This should ideally be the team member's user_id

        if (tasksError) throw tasksError;

        const tasksTotal = tasksData?.length || 0;
        const tasksCompleted = tasksData?.filter(task => 
          task.status === 'Completed'
        ).length || 0;

        performanceData[member.id] = {
          leadsAssigned,
          leadsConverted,
          tasksCompleted,
          tasksTotal
        };
      } catch (error) {
        console.error(`Error fetching performance for ${member.name}:`, error);
        performanceData[member.id] = {
          leadsAssigned: 0,
          leadsConverted: 0,
          tasksCompleted: 0,
          tasksTotal: 0
        };
      }
    }

    setMemberPerformance(performanceData);
  };

  const deleteTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member deleted successfully",
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team member",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user]);

  return {
    teamMembers,
    memberPerformance,
    loading,
    refetch: fetchTeamMembers,
    deleteTeamMember
  };
};
