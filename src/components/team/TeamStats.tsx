
import { Users, Target, TrendingUp, Activity } from "lucide-react";
import { MemberPerformance } from "@/hooks/useTeamMembers";

interface TeamStatsProps {
  memberPerformance: Record<string, MemberPerformance>;
  teamMembersCount: number;
}

export const TeamStats = ({ memberPerformance, teamMembersCount }: TeamStatsProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate total team performance
  const totalTeamStats = Object.values(memberPerformance).reduce((acc, perf) => ({
    totalLeads: acc.totalLeads + (perf.leadsAssigned || 0),
    totalConverted: acc.totalConverted + (perf.leadsConverted || 0),
    totalRevenue: acc.totalRevenue + (perf.totalRevenue || 0),
    totalTasks: acc.totalTasks + (perf.tasksTotal || 0),
    totalCommunications: acc.totalCommunications + (perf.totalCommunications || 0),
    totalAppointments: acc.totalAppointments + (perf.totalAppointments || 0)
  }), { 
    totalLeads: 0, 
    totalConverted: 0, 
    totalRevenue: 0, 
    totalTasks: 0, 
    totalCommunications: 0, 
    totalAppointments: 0 
  });

  if (teamMembersCount === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-1">Total Team Leads</p>
          <p className="text-white text-2xl font-bold mb-1">{totalTeamStats.totalLeads}</p>
          <p className="text-blue-400 text-xs">Across all team members</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
            <Target className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-1">Total Conversions</p>
          <p className="text-white text-2xl font-bold mb-1">{totalTeamStats.totalConverted}</p>
          <p className="text-green-400 text-xs">
            {totalTeamStats.totalLeads > 0 
              ? `${Math.round((totalTeamStats.totalConverted / totalTeamStats.totalLeads) * 100)}% conversion rate`
              : 'No leads yet'
            }
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-1">Total Revenue (INR)</p>
          <p className="text-white text-2xl font-bold mb-1">
            {formatCurrency(totalTeamStats.totalRevenue)}
          </p>
          <p className="text-purple-400 text-xs">Team generated revenue</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-sm mb-1">Total Activities</p>
          <p className="text-white text-2xl font-bold mb-1">
            {totalTeamStats.totalTasks + totalTeamStats.totalCommunications + totalTeamStats.totalAppointments}
          </p>
          <p className="text-orange-400 text-xs">Tasks, calls, meetings</p>
        </div>
      </div>
    </div>
  );
};
