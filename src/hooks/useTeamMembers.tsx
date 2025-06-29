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

interface RealtimePayload {
  eventType: string;
  new?: { name?: string; [key: string]: any };
  old?: { name?: string; [key: string]: any };
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
      console.log('🔄 Fetching team members and performance data...');
      
      // Fetch team members created by this admin
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id) // Only get team members created by this admin
        .order('created_at', { ascending: false });

      if (teamError) throw teamError;
      setTeamMembers(teamData || []);
      
      // Fetch comprehensive performance data for each team member
      const performanceData: Record<string, any> = {};
      const activitiesData: Record<string, any[]> = {};
      
      for (const member of teamData || []) {
        console.log(`📊 Fetching data for team member: ${member.name} (${member.email})`);
        
        // Get auth user for this team member
        let authUserId: string | null = null;
        
        try {
          // Find the auth user by email
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          if (!authError && authUsers) {
            const authUser = authUsers.users.find(u => u.email === member.email);
            if (authUser) {
              authUserId = authUser.id;
              console.log(`✅ Found auth user ID for ${member.email}: ${authUserId}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not get auth user for ${member.email}:`, error);
        }

        // Get all leads assigned to this team member OR created by them
        let allLeads: any[] = [];
        
        // Method A: Leads assigned to this team member directly
        const { data: assignedLeads, error: assignedError } = await supabase
          .from('leads')
          .select('*')
          .eq('assigned_team_member_id', member.id);

        if (!assignedError && assignedLeads) {
          allLeads = [...allLeads, ...assignedLeads];
          console.log(`📋 Found ${assignedLeads.length} leads assigned to ${member.name}`);
        }

        // Method B: Leads created by the auth user (if we found one)
        if (authUserId) {
          const { data: userLeads, error: userLeadsError } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', authUserId);

          if (!userLeadsError && userLeads) {
            // Merge and deduplicate
            const newLeads = userLeads.filter(ul => !allLeads.some(al => al.id === ul.id));
            allLeads = [...allLeads, ...newLeads];
            console.log(`📋 Found ${userLeads.length} leads created by ${member.name} (${newLeads.length} new)`);
          }
        }

        console.log(`📊 Total unique leads for ${member.name}: ${allLeads.length}`);

        // Get tasks, communications, appointments for this team member
        let tasks: any[] = [];
        let communications: any[] = [];
        let appointments: any[] = [];
        let activities: any[] = [];

        if (authUserId) {
          // Get tasks
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', authUserId);
          tasks = tasksData || [];

          // Get communications
          const { data: commsData } = await supabase
            .from('communications')
            .select('*')
            .eq('user_id', authUserId);
          communications = commsData || [];

          // Get appointments
          const { data: apptsData } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', authUserId);
          appointments = apptsData || [];

          // Get activities (both their own and admin activities about them)
          const { data: activitiesData } = await supabase
            .from('activities')
            .select('*')
            .or(`user_id.eq.${authUserId},user_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(10);
          activities = activitiesData || [];
          activitiesData[member.id] = activities;
        }

        // Calculate comprehensive performance metrics
        const convertedLeads = allLeads.filter(lead => lead.status === 'Converted');
        const totalRevenue = convertedLeads
          .filter(lead => lead.value)
          .reduce((sum, lead) => sum + (lead.value || 0), 0);

        const conversionRate = allLeads.length > 0 
          ? Math.round((convertedLeads.length / allLeads.length) * 100)
          : 0;

        const completedTasks = tasks.filter(task => task.status === 'Completed');
        const tasksCompletionRate = tasks.length > 0 
          ? Math.round((completedTasks.length / tasks.length) * 100) 
          : 0;

        // Calculate performance score
        const performanceScore = Math.min(100, Math.round(
          (conversionRate * 0.4) + 
          (tasksCompletionRate * 0.3) +
          (Math.min(communications.length * 2, 20)) + 
          (Math.min(appointments.length * 1.5, 15))
        ));

        performanceData[member.id] = {
          // Lead metrics
          leadsAssigned: allLeads.length,
          leadsConverted: convertedLeads.length,
          leadsNew: allLeads.filter(lead => lead.status === 'New').length,
          leadsContacted: allLeads.filter(lead => lead.status === 'Contacted').length,
          leadsFollowUp: allLeads.filter(lead => lead.status === 'Follow-Up').length,
          leadsLost: allLeads.filter(lead => lead.status === 'Lost').length,
          
          // Financial metrics
          totalRevenue,
          averageDealSize: convertedLeads.length > 0 
            ? Math.round(totalRevenue / convertedLeads.length)
            : 0,
          conversionRate,
          
          // Activity metrics
          tasksTotal: tasks.length,
          tasksCompleted: completedTasks.length,
          tasksCompletionRate,
          
          // Communication metrics
          totalCommunications: communications.length,
          callsCompleted: communications.filter(comm => comm.type === 'call' && comm.status === 'Completed').length,
          emailsSent: communications.filter(comm => comm.type === 'email' && comm.status === 'Sent').length,
          
          // Appointment metrics
          totalAppointments: appointments.length,
          upcomingAppointments: appointments.filter(apt => new Date(apt.start_time) > new Date()).length,
          completedAppointments: appointments.filter(apt => apt.status === 'Completed').length,
          
          // Recent activity count
          recentActivities: activities.length,
          
          // Last activity date
          lastActivity: activities.length > 0 
            ? new Date(activities[0].created_at).toLocaleDateString()
            : 'No activity',
            
          // Performance score
          performanceScore,

          // Debug info
          authUserId,
          hasAuthUser: !!authUserId,
          dataSource: authUserId ? 'user_data' : 'assignment_based'
        };

        console.log(`✅ Performance summary for ${member.name}:`, {
          email: member.email,
          authUserId,
          hasAuthUser: !!authUserId,
          totalLeads: allLeads.length,
          convertedLeads: convertedLeads.length,
          totalRevenue,
          conversionRate: `${conversionRate}%`,
          tasks: tasks.length,
          communications: communications.length,
          appointments: appointments.length,
          activities: activities.length,
          performanceScore,
          dataSource: authUserId ? 'user_data' : 'assignment_based'
        });
      }
      
      setMemberPerformance(performanceData);
      setMemberActivities(activitiesData);
      console.log('🎉 Team performance data loaded successfully!');
      
    } catch (error) {
      console.error('❌ Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up comprehensive real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('🚀 Setting up team performance tracking...');
    fetchTeamMembers();

    // Subscribe to all relevant table changes
    const leadsChannel = supabase
      .channel('team-performance-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
        const typedPayload = payload as RealtimePayload;
        console.log('📋 Lead change detected:', typedPayload.eventType, typedPayload.new?.name || typedPayload.old?.name);
        setTimeout(fetchTeamMembers, 1000); // Delay to ensure data consistency
      })
      .subscribe();

    const tasksChannel = supabase
      .channel('team-performance-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
        const typedPayload = payload as RealtimePayload;
        console.log('📋 Task change detected:', typedPayload.eventType);
        setTimeout(fetchTeamMembers, 1000);
      })
      .subscribe();

    const communicationsChannel = supabase
      .channel('team-performance-communications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, (payload: any) => {
        const typedPayload = payload as RealtimePayload;
        console.log('📞 Communication change detected:', typedPayload.eventType);
        setTimeout(fetchTeamMembers, 1000);
      })
      .subscribe();

    const appointmentsChannel = supabase
      .channel('team-performance-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload: any) => {
        const typedPayload = payload as RealtimePayload;
        console.log('📅 Appointment change detected:', typedPayload.eventType);
        setTimeout(fetchTeamMembers, 1000);
      })
      .subscribe();

    const activitiesChannel = supabase
      .channel('team-performance-activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload: any) => {
        const typedPayload = payload as RealtimePayload;
        console.log('🎯 Activity change detected:', typedPayload.eventType);
        setTimeout(fetchTeamMembers, 1000);
      })
      .subscribe();

    const teamChannel = supabase
      .channel('team-members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, (payload: any) => {
        const typedPayload = payload as RealtimePayload;
        console.log('👥 Team member change detected:', typedPayload.eventType);
        setTimeout(fetchTeamMembers, 1000);
      })
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up team performance subscriptions...');
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