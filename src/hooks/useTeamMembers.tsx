
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

export interface MemberPerformance {
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

export interface MemberActivity {
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
      await fetchPerformanceData(data || []);
      
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

  const fetchPerformanceData = async (members: TeamMember[]) => {
    const performanceData: Record<string, MemberPerformance> = {};
    const activitiesData: Record<string, MemberActivity[]> = {};

    for (const member of members) {
      try {
        // Try to get user by email first
        const { data: userData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', member.email)
          .single();

        const userId = userData?.id || member.user_id;

        if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
          // Fetch leads data
          const { data: leadsData } = await supabase
            .from('leads')
            .select('*')
            .or(`user_id.eq.${userId},assigned_team_member_id.eq.${member.id}`);

          // Fetch tasks data
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);

          // Fetch communications data
          const { data: communicationsData } = await supabase
            .from('communications')
            .select('*')
            .eq('user_id', userId);

          // Fetch appointments data
          const { data: appointmentsData } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', userId);

          // Fetch activities data
          const { data: activitiesDataRaw } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          // Calculate performance metrics
          const leads = leadsData || [];
          const tasks = tasksData || [];
          const communications = communicationsData || [];
          const appointments = appointmentsData || [];
          const activities = activitiesDataRaw || [];

          const convertedLeads = leads.filter(lead => lead.status === 'Converted');
          const totalRevenue = convertedLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
          const completedTasks = tasks.filter(task => task.status === 'Completed');

          performanceData[member.id] = {
            leadsAssigned: leads.length,
            leadsConverted: convertedLeads.length,
            leadsNew: leads.filter(lead => lead.status === 'New').length,
            leadsContacted: leads.filter(lead => lead.status === 'Contacted').length,
            leadsFollowUp: leads.filter(lead => lead.status === 'Follow-Up').length,
            leadsLost: leads.filter(lead => lead.status === 'Lost').length,
            totalRevenue,
            averageDealSize: convertedLeads.length > 0 ? totalRevenue / convertedLeads.length : 0,
            conversionRate: leads.length > 0 ? Math.round((convertedLeads.length / leads.length) * 100) : 0,
            tasksTotal: tasks.length,
            tasksCompleted: completedTasks.length,
            tasksCompletionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
            totalCommunications: communications.length,
            callsCompleted: communications.filter(comm => comm.type === 'Call' && comm.status === 'Completed').length,
            emailsSent: communications.filter(comm => comm.type === 'Email').length,
            totalAppointments: appointments.length,
            upcomingAppointments: appointments.filter(apt => new Date(apt.start_time) > new Date()).length,
            completedAppointments: appointments.filter(apt => apt.status === 'Completed').length,
            recentActivities: activities.length,
            lastActivity: activities.length > 0 ? activities[0].title : 'No recent activity',
            performanceScore: calculatePerformanceScore({
              conversionRate: leads.length > 0 ? (convertedLeads.length / leads.length) * 100 : 0,
              taskCompletionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
              totalActivities: activities.length,
              totalRevenue
            })
          };

          activitiesData[member.id] = activities.map(activity => ({
            id: activity.id,
            title: activity.title,
            description: activity.description || '',
            created_at: activity.created_at,
            type: activity.type
          }));
        } else {
          // Default performance data for members without linked user accounts
          performanceData[member.id] = {
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
            lastActivity: 'No activity - account not linked',
            performanceScore: 0
          };

          activitiesData[member.id] = [];
        }
      } catch (error) {
        console.error(`Error fetching performance data for ${member.name}:`, error);
        // Set default performance data on error
        performanceData[member.id] = {
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
          lastActivity: 'Error loading data',
          performanceScore: 0
        };

        activitiesData[member.id] = [];
      }
    }

    setMemberPerformance(performanceData);
    setMemberActivities(activitiesData);
  };

  const calculatePerformanceScore = (metrics: {
    conversionRate: number;
    taskCompletionRate: number;
    totalActivities: number;
    totalRevenue: number;
  }) => {
    // Simple performance scoring algorithm
    let score = 0;
    
    // Conversion rate (40% of score)
    score += (metrics.conversionRate / 100) * 40;
    
    // Task completion rate (30% of score)
    score += (metrics.taskCompletionRate / 100) * 30;
    
    // Activity level (20% of score)
    const activityScore = Math.min(metrics.totalActivities / 10, 1); // Cap at 10 activities for full score
    score += activityScore * 20;
    
    // Revenue contribution (10% of score)
    const revenueScore = Math.min(metrics.totalRevenue / 100000, 1); // Cap at 100K for full score
    score += revenueScore * 10;
    
    return Math.round(score);
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
