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
  const [memberActivities, setMemberActivities] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
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
      
      // Fetch comprehensive performance and activity data for each team member
      const performanceData: Record<string, any> = {};
      const activitiesData: Record<string, any[]> = {};
      
      for (const member of teamData || []) {
        console.log(`Fetching data for team member: ${member.name} (${member.email})`);
        
        // Method 1: Get all leads associated with this team member
        const { data: memberLeads, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .or(`assigned_to.eq.${member.email},assigned_team_member_id.eq.${member.id}`);

        if (leadsError) {
          console.error('Error fetching member leads:', leadsError);
        }

        // Method 2: Get leads created by users with matching email
        const { data: usersByEmail, error: usersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', member.email);

        let userCreatedLeads: any[] = [];
        if (!usersError && usersByEmail && usersByEmail.length > 0) {
          const userIds = usersByEmail.map(u => u.id);
          const { data: userLeads, error: userLeadsError } = await supabase
            .from('leads')
            .select('*')
            .in('user_id', userIds);

          if (!userLeadsError) {
            userCreatedLeads = userLeads || [];
          }
        }

        // Method 3: Get leads from auth.users table matching email
        const { data: authUsers, error: authError } = await supabase
          .rpc('get_user_by_email', { user_email: member.email })
          .single();

        let authUserLeads: any[] = [];
        if (!authError && authUsers) {
          const { data: authLeads, error: authLeadsError } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', authUsers.id);

          if (!authLeadsError) {
            authUserLeads = authLeads || [];
          }
        }

        // Combine all leads and remove duplicates
        const allMemberLeads = [
          ...(memberLeads || []),
          ...userCreatedLeads,
          ...authUserLeads
        ];

        const uniqueLeads = allMemberLeads.filter((lead, index, self) => 
          index === self.findIndex(l => l.id === lead.id)
        );

        // Get tasks for this team member
        const { data: memberTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .or(`user_id.eq.${authUsers?.id || 'none'}`);

        const tasks = memberTasks || [];
        const completedTasks = tasks.filter(task => task.status === 'Completed');

        // Get communications for this team member
        const { data: memberComms, error: commsError } = await supabase
          .from('communications')
          .select('*')
          .or(`user_id.eq.${authUsers?.id || 'none'}`);

        const communications = memberComms || [];

        // Get appointments for this team member
        const { data: memberAppts, error: apptsError } = await supabase
          .from('appointments')
          .select('*')
          .or(`user_id.eq.${authUsers?.id || 'none'}`);

        const appointments = memberAppts || [];

        // Get activities for this team member
        const { data: memberActivitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .or(`user_id.eq.${authUsers?.id || 'none'}`)
          .order('created_at', { ascending: false })
          .limit(10);

        activitiesData[member.id] = memberActivitiesData || [];

        // Calculate comprehensive performance metrics
        const totalRevenue = uniqueLeads
          .filter(lead => lead.status === 'Converted' && lead.value)
          .reduce((sum, lead) => sum + (lead.value || 0), 0);

        const conversionRate = uniqueLeads.length > 0 
          ? Math.round((uniqueLeads.filter(lead => lead.status === 'Converted').length / uniqueLeads.length) * 100)
          : 0;

        performanceData[member.id] = {
          // Lead metrics
          leadsAssigned: uniqueLeads.length,
          leadsConverted: uniqueLeads.filter(lead => lead.status === 'Converted').length,
          leadsNew: uniqueLeads.filter(lead => lead.status === 'New').length,
          leadsContacted: uniqueLeads.filter(lead => lead.status === 'Contacted').length,
          leadsFollowUp: uniqueLeads.filter(lead => lead.status === 'Follow-Up').length,
          leadsLost: uniqueLeads.filter(lead => lead.status === 'Lost').length,
          
          // Financial metrics
          totalRevenue,
          averageDealSize: uniqueLeads.filter(lead => lead.status === 'Converted').length > 0 
            ? Math.round(totalRevenue / uniqueLeads.filter(lead => lead.status === 'Converted').length)
            : 0,
          conversionRate,
          
          // Activity metrics
          tasksTotal: tasks.length,
          tasksCompleted: completedTasks.length,
          tasksCompletionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
          
          // Communication metrics
          totalCommunications: communications.length,
          callsCompleted: communications.filter(comm => comm.type === 'call' && comm.status === 'Completed').length,
          emailsSent: communications.filter(comm => comm.type === 'email' && comm.status === 'Sent').length,
          
          // Appointment metrics
          totalAppointments: appointments.length,
          upcomingAppointments: appointments.filter(apt => new Date(apt.start_time) > new Date()).length,
          completedAppointments: appointments.filter(apt => apt.status === 'Completed').length,
          
          // Recent activity count
          recentActivities: (memberActivitiesData || []).length,
          
          // Last activity date
          lastActivity: (memberActivitiesData || []).length > 0 
            ? new Date((memberActivitiesData || [])[0].created_at).toLocaleDateString()
            : 'No activity',
            
          // Performance score (weighted calculation)
          performanceScore: Math.round(
            (conversionRate * 0.4) + 
            (tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 * 0.3 : 0) +
            (communications.length * 2) + 
            (appointments.length * 1.5)
          )
        };

        console.log(`Performance data for ${member.name}:`, {
          email: member.email,
          totalLeads: uniqueLeads.length,
          convertedLeads: uniqueLeads.filter(lead => lead.status === 'Converted').length,
          totalRevenue,
          tasks: tasks.length,
          communications: communications.length,
          appointments: appointments.length,
          activities: (memberActivitiesData || []).length
        });
      }
      
      setMemberPerformance(performanceData);
      setMemberActivities(activitiesData);
      console.log('Final comprehensive performance data:', performanceData);
      
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

  // Set up comprehensive real-time subscriptions
  useEffect(() => {
    if (!user) return;

    fetchTeamMembers();

    // Subscribe to all relevant table changes
    const leadsChannel = supabase
      .channel('team-performance-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        console.log('Lead change detected, refreshing team performance');
        setTimeout(fetchTeamMembers, 100);
      })
      .subscribe();

    const tasksChannel = supabase
      .channel('team-performance-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        console.log('Task change detected, refreshing team performance');
        setTimeout(fetchTeamMembers, 100);
      })
      .subscribe();

    const communicationsChannel = supabase
      .channel('team-performance-communications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        console.log('Communication change detected, refreshing team performance');
        setTimeout(fetchTeamMembers, 100);
      })
      .subscribe();

    const appointmentsChannel = supabase
      .channel('team-performance-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        console.log('Appointment change detected, refreshing team performance');
        setTimeout(fetchTeamMembers, 100);
      })
      .subscribe();

    const activitiesChannel = supabase
      .channel('team-performance-activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        console.log('Activity change detected, refreshing team performance');
        setTimeout(fetchTeamMembers, 100);
      })
      .subscribe();

    const teamChannel = supabase
      .channel('team-members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        console.log('Team member change detected, refreshing team data');
        setTimeout(fetchTeamMembers, 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(communicationsChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(activitiesChannel);
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
    memberActivities,
    loading,
    refetch: fetchTeamMembers,
    deleteTeamMember,
  };
};