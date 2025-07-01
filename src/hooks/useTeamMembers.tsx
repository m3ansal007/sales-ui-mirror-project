
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  hire_date?: string;
  status: string;
  user_id: string;
}

export interface CreateTeamMemberData {
  name: string;
  email: string;
  role: string;
  phone?: string;
  hire_date?: string;
  temp_password?: string;
}

interface MemberPerformance {
  leadsAssigned: number;
  leadsConverted: number;
  leadsNew: number;
  leadsContacted: number;
  leadsFollowUp: number;
  leadsLost: number;
  totalRevenue: number;
  averageDealSize: number;
  conversionRate: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksCompletionRate: number;
  totalCommunications: number;
  callsCompleted: number;
  emailsSent: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  recentActivities: number;
  lastActivity: string;
  performanceScore: number;
}

interface MemberActivity {
  id: string;
  title: string;
  description: string;
  created_at: string;
  type: string;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberPerformance, setMemberPerformance] = useState<Record<string, MemberPerformance>>({});
  const [memberActivities, setMemberActivities] = useState<Record<string, MemberActivity[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    console.log('🔄 Fetching team members and performance data...');
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('status', 'Active')
        .order('name');

      if (error) throw error;
      
      console.log('📊 Found team members:', data);
      setTeamMembers(data || []);
      
      // Fetch performance data for each team member
      if (data && data.length > 0) {
        await fetchMemberPerformanceData(data);
      }
      
      console.log('🎉 Team performance data loaded successfully!');
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

  const fetchMemberPerformanceData = async (members: TeamMember[]) => {
    const performanceData: Record<string, MemberPerformance> = {};
    const activitiesData: Record<string, MemberActivity[]> = {};

    for (const member of members) {
      // Initialize default performance data
      const defaultPerformance: MemberPerformance = {
        leadsAssigned: 0,
        leadsConverted: 0,
        leadsNew: 0,
        leadsContacted: 0,
        leadsFollowUp: 0,
        leadsLost: 0,
        totalRevenue: 0,
        averageDealSize: 0,
        conversionRate: 0,
        tasksTotal: 0,
        tasksCompleted: 0,
        tasksCompletionRate: 0,
        totalCommunications: 0,
        callsCompleted: 0,
        emailsSent: 0,
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0,
        recentActivities: 0,
        lastActivity: 'No activity yet',
        performanceScore: 0,
      };

      try {
        // Try to find user in auth.users by email to get actual user_id
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === member.email);
        
        if (authUser) {
          // Fetch leads data
          const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', authUser.id);

          if (leads) {
            const leadsAssigned = leads.length;
            const leadsConverted = leads.filter(l => l.status === 'Converted').length;
            const leadsNew = leads.filter(l => l.status === 'New').length;
            const leadsContacted = leads.filter(l => l.status === 'Contacted').length;
            const leadsFollowUp = leads.filter(l => l.status === 'Follow-Up').length;
            const leadsLost = leads.filter(l => l.status === 'Lost').length;
            const totalRevenue = leads
              .filter(l => l.status === 'Converted')
              .reduce((sum, l) => sum + (l.value || 0), 0);

            defaultPerformance.leadsAssigned = leadsAssigned;
            defaultPerformance.leadsConverted = leadsConverted;
            defaultPerformance.leadsNew = leadsNew;
            defaultPerformance.leadsContacted = leadsContacted;
            defaultPerformance.leadsFollowUp = leadsFollowUp;
            defaultPerformance.leadsLost = leadsLost;
            defaultPerformance.totalRevenue = totalRevenue;
            defaultPerformance.averageDealSize = leadsConverted > 0 ? totalRevenue / leadsConverted : 0;
            defaultPerformance.conversionRate = leadsAssigned > 0 ? Math.round((leadsConverted / leadsAssigned) * 100) : 0;
          }

          // Fetch tasks data
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', authUser.id);

          if (tasks) {
            const tasksTotal = tasks.length;
            const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;
            defaultPerformance.tasksTotal = tasksTotal;
            defaultPerformance.tasksCompleted = tasksCompleted;
            defaultPerformance.tasksCompletionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
          }

          // Fetch communications data
          const { data: communications } = await supabase
            .from('communications')
            .select('*')
            .eq('user_id', authUser.id);

          if (communications) {
            defaultPerformance.totalCommunications = communications.length;
            defaultPerformance.callsCompleted = communications.filter(c => c.type === 'Call').length;
            defaultPerformance.emailsSent = communications.filter(c => c.type === 'Email').length;
          }

          // Fetch appointments data
          const { data: appointments } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', authUser.id);

          if (appointments) {
            const now = new Date();
            defaultPerformance.totalAppointments = appointments.length;
            defaultPerformance.upcomingAppointments = appointments.filter(a => new Date(a.start_time) > now).length;
            defaultPerformance.completedAppointments = appointments.filter(a => a.status === 'Completed').length;
          }

          // Fetch activities data
          const { data: activities } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (activities) {
            defaultPerformance.recentActivities = activities.length;
            if (activities.length > 0) {
              defaultPerformance.lastActivity = new Date(activities[0].created_at).toLocaleDateString();
            }
            activitiesData[member.id] = activities;
          }

          // Calculate performance score
          const score = Math.min(100, Math.round(
            (defaultPerformance.conversionRate * 0.4) +
            (defaultPerformance.tasksCompletionRate * 0.3) +
            (Math.min(defaultPerformance.totalCommunications * 5, 100) * 0.2) +
            (Math.min(defaultPerformance.totalAppointments * 10, 100) * 0.1)
          ));
          defaultPerformance.performanceScore = score;
        }
      } catch (error) {
        console.error(`Error fetching performance data for ${member.name}:`, error);
      }

      performanceData[member.id] = defaultPerformance;
      if (!activitiesData[member.id]) {
        activitiesData[member.id] = [];
      }
    }

    setMemberPerformance(performanceData);
    setMemberActivities(activitiesData);
  };

  const createTeamMember = async (memberData: CreateTeamMemberData) => {
    try {
      // First check if a user with this email already exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberData.email)
        .single();

      let userId = null;
      if (!userError && existingUser) {
        userId = existingUser.id;
        console.log('Found existing user for email:', memberData.email, 'User ID:', userId);
      }

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...memberData,
          user_id: userId || '00000000-0000-0000-0000-000000000000', // Temporary ID if no user found
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTeamMembers();
      
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error creating team member:', error);
      toast({
        title: "Error",
        description: `Failed to create team member: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchTeamMembers();
      
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: `Failed to update team member: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'Inactive' })
        .eq('id', id);

      if (error) throw error;

      await fetchTeamMembers();
      
      toast({
        title: "Success",
        description: "Team member deactivated successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deactivating team member:', error);
      toast({
        title: "Error",
        description: `Failed to deactivate team member: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const refetch = fetchTeamMembers;

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    memberPerformance,
    memberActivities,
    loading,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    refetch,
  };
};
