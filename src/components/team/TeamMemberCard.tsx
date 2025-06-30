
import { Mail, Phone, Trash2, UserCheck, UserX, Activity, CheckCircle, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamMember, MemberPerformance, MemberActivity } from "@/hooks/useTeamMembers";

interface TeamMemberCardProps {
  member: TeamMember;
  performance: MemberPerformance;
  activities: MemberActivity[];
  isExpanded: boolean;
  canManageTeam: boolean;
  userRole: string;
  onToggleExpand: () => void;
  onDelete: (memberId: string, memberName: string) => void;
}

export const TeamMemberCard = ({ 
  member, 
  performance, 
  activities, 
  isExpanded, 
  canManageTeam, 
  userRole,
  onToggleExpand, 
  onDelete 
}: TeamMemberCardProps) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-500/20 text-purple-400';
      case 'Sales Manager': return 'bg-blue-500/20 text-blue-400';
      case 'Sales Associate': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return '👑';
      case 'Sales Manager': return '📊';
      case 'Sales Associate': return '💼';
      default: return '👤';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getRoleIcon(member.role)}</span>
            <h3 className="text-white font-medium text-lg">{member.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(performance.performanceScore)}`}>
              {performance.performanceScore}% Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
              {member.role}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              member.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
              member.status === 'Away' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {member.status === 'Active' ? <UserCheck className="w-3 h-3 inline mr-1" /> : <UserX className="w-3 h-3 inline mr-1" />}
              {member.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpand}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {isExpanded ? 'Less' : 'Details'}
          </Button>
          {canManageTeam && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(member.id, member.name)}
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Mail className="w-4 h-4" />
          {member.email}
        </div>
        {member.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Phone className="w-4 h-4" />
            {member.phone}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Activity className="w-4 h-4" />
          Last activity: {performance.lastActivity}
        </div>
      </div>

      {/* Core Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        <div>
          <p className="text-slate-400 text-xs">Total Leads</p>
          <p className="text-white font-medium">{performance.leadsAssigned}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Converted</p>
          <p className="text-green-400 font-medium">{performance.leadsConverted}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2">
        <div className="text-center">
          <p className="text-slate-400 text-xs">New</p>
          <p className="text-blue-400 font-medium text-sm">{performance.leadsNew}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">Contacted</p>
          <p className="text-yellow-400 font-medium text-sm">{performance.leadsContacted}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">Follow-up</p>
          <p className="text-orange-400 font-medium text-sm">{performance.leadsFollowUp}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">Lost</p>
          <p className="text-red-400 font-medium text-sm">{performance.leadsLost}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-3">
        <div>
          <p className="text-slate-400 text-xs">Revenue (INR)</p>
          <p className="text-green-400 font-medium">
            {formatCurrency(performance.totalRevenue)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Conversion Rate</p>
          <p className="text-white font-medium">{performance.conversionRate}%</p>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
          {/* Activity Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <p className="text-slate-400 text-xs">Tasks</p>
              </div>
              <p className="text-white font-medium">{performance.tasksCompleted}/{performance.tasksTotal}</p>
              <p className="text-blue-400 text-xs">{performance.tasksCompletionRate}% complete</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <p className="text-slate-400 text-xs">Communications</p>
              </div>
              <p className="text-white font-medium">{performance.totalCommunications}</p>
              <p className="text-green-400 text-xs">{performance.callsCompleted} calls, {performance.emailsSent} emails</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-purple-400" />
                <p className="text-slate-400 text-xs">Appointments</p>
              </div>
              <p className="text-white font-medium">{performance.totalAppointments}</p>
              <p className="text-purple-400 text-xs">{performance.upcomingAppointments} upcoming</p>
            </div>
          </div>

          {/* Recent Activities */}
          {activities.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">Recent Activities</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                    <span className="text-white">{activity.title}</span> - {activity.description}
                    <div className="text-slate-500 mt-1">
                      {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Insights */}
          <div className="bg-slate-800/50 p-3 rounded-lg">
            <h4 className="text-white font-medium mb-2">Performance Insights (INR)</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Avg Deal Size</p>
                <p className="text-white">{formatCurrency(performance.averageDealSize)}</p>
              </div>
              <div>
                <p className="text-slate-400">Activities Score</p>
                <p className={`font-medium ${getPerformanceColor(performance.performanceScore)}`}>
                  {performance.performanceScore}/100
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Overall Performance</span>
          <span>{performance.performanceScore}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              performance.performanceScore >= 80 ? 'bg-green-500' :
              performance.performanceScore >= 60 ? 'bg-yellow-500' :
              performance.performanceScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(performance.performanceScore, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Role-specific information */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-400">
          {member.role === 'Admin' && '🔧 Full system access and team management'}
          {member.role === 'Sales Manager' && '📈 Team oversight and lead management'}
          {member.role === 'Sales Associate' && '💼 Individual lead and task management'}
        </p>
      </div>

      {/* Debug info for admins */}
      {userRole === 'Admin' && (
        <div className="mt-2 p-2 bg-slate-800/30 rounded text-xs text-slate-500">
          Debug: Member ID: {member.id.slice(0, 8)}... | Email: {member.email} | Activities: {performance.recentActivities}
        </div>
      )}
    </div>
  );
};
