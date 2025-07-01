import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, User, MessageSquare, Phone, Mail, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface LeadActivityFeedProps {
  leadId?: string;
}

export const LeadActivityFeed: React.FC<LeadActivityFeedProps> = ({ leadId }) => {
  const { user, userRole } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch activities based on leadId here
    // Replace this with your actual data fetching logic
    const mockActivities = [
      {
        id: '1',
        type: 'Task',
        title: 'Follow up call',
        description: 'Call the lead to discuss the proposal',
        createdAt: '2024-07-15T10:00:00.000Z',
      },
      {
        id: '2',
        type: 'Email',
        title: 'Sent proposal',
        description: 'Sent the proposal to the lead',
        createdAt: '2024-07-14T15:30:00.000Z',
      },
      {
        id: '3',
        type: 'Meeting',
        title: 'Initial meeting',
        description: 'Met with the lead to discuss their needs',
        createdAt: '2024-07-10T11:00:00.000Z',
      },
    ];

    setActivities(mockActivities);
  }, [leadId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Task':
        return <Clock className="h-4 w-4 mr-2 text-blue-500" />;
      case 'Email':
        return <Mail className="h-4 w-4 mr-2 text-yellow-500" />;
      case 'Meeting':
        return <Calendar className="h-4 w-4 mr-2 text-green-500" />;
      case 'Call':
        return <Phone className="h-4 w-4 mr-2 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
      <h4 className="text-lg font-semibold text-white mb-4">Activity Feed</h4>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id} className="py-2 border-b border-slate-700 last:border-none">
            <div className="flex items-center mb-1">
              {getActivityIcon(activity.type)}
              <span className="text-sm font-medium text-slate-300">{activity.title}</span>
            </div>
            <p className="text-xs text-slate-400">{activity.description}</p>
            <p className="text-xs text-slate-500">
              {new Date(activity.createdAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
