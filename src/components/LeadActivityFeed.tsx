
import { ChevronRight, Plus, User, Phone, Mail, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { AddLeadModal } from "@/components/AddLeadModal";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const LeadActivityFeed = () => {
  const [showAddLead, setShowAddLead] = useState(false);
  const [activities, setActivities] = useState([]);
  const { createLead } = useLeads();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();

    // Subscribe to real-time activity changes
    const activitiesChannel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities'
        },
        (payload) => {
          console.log('New activity:', payload.new);
          setActivities(prev => [payload.new, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
    };
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return User;
      case 'updated': return MessageCircle;
      default: return User;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created': return 'text-blue-400';
      case 'updated': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          <button 
            onClick={() => setShowAddLead(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Lead
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Live Updates</h3>
            <button className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No recent activity. Start by adding a new lead!
            </div>
          ) : (
            activities.map((activity, index) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className={`p-1 rounded ${getActivityColor(activity.type)}`}>
                    <ActivityIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm">
                      {activity.title}: <span className="text-white font-medium">{activity.description}</span>
                    </p>
                    <p className="text-slate-500 text-xs mt-1">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AddLeadModal 
        isOpen={showAddLead} 
        onClose={() => setShowAddLead(false)} 
        onSubmit={createLead}
      />
    </>
  );
};
