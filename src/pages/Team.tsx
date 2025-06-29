import { Users, Plus, Mail, Phone, Trash2, UserCheck, UserX, TrendingUp, Target } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import AddTeamMemberModal from "@/components/AddTeamMemberModal";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Team = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState('All Members');
  const { teamMembers, memberPerformance, loading, refetch, deleteTeamMember } = useTeamMembers();
  const { userRole } = useAuth();

  const filteredMembers = teamMembers.filter(member => {
    if (filter === 'All Members') return true;
    if (filter === 'Active') return member.status === 'Active';
    if (filter === 'Sales Managers') return member.role === 'Sales Manager';
    if (filter === 'Sales Associates') return member.role === 'Sales Associate';
    return true;
  });

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      await deleteTeamMember(memberId);
    }
  };

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

  // Check if user has permission to manage team
  const canManageTeam = userRole === 'Admin' || userRole === 'Sales Manager';

  // Calculate total team performance
  const totalTeamStats = Object.values(memberPerformance).reduce((acc, perf) => ({
    totalLeads: acc.totalLeads + (perf.leadsAssigned || 0),
    totalConverted: acc.totalConverted + (perf.leadsConverted || 0),
    totalRevenue: acc.totalRevenue + (perf.totalRevenue || 0)
  }), { totalLeads: 0, totalConverted: 0, totalRevenue: 0 });

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Team & Roles</h1>
            <p className="text-slate-400">Manage your sales team and track performance</p>
            {!canManageTeam && (
              <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ You have view-only access to team information. Contact your admin to manage team members.
                </p>
              </div>
            )}
          </div>

          {/* Team Performance Overview */}
          {teamMembers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
                  <p className="text-white text-2xl font-bold mb-1">
                    ₹{totalTeamStats.totalRevenue >= 1000 
                      ? `${(totalTeamStats.totalRevenue / 1000).toFixed(1)}k` 
                      : totalTeamStats.totalRevenue.toLocaleString()
                    }
                  </p>
                  <p className="text-purple-400 text-xs">Team generated revenue</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button 
                onClick={() => setFilter('All Members')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'All Members' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Members
              </button>
              <button 
                onClick={() => setFilter('Active')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'Active' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('Sales Managers')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'Sales Managers' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sales Managers
              </button>
              <button 
                onClick={() => setFilter('Sales Associates')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'Sales Associates' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sales Associates
              </button>
            </div>
            {canManageTeam && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Team Member
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading team members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No team members found</p>
              <p className="text-sm">
                {filter === 'All Members' 
                  ? canManageTeam 
                    ? 'Add your first team member to get started' 
                    : 'No team members have been added yet'
                  : `No team members match the "${filter}" filter`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMembers.map((member) => {
                const performance = memberPerformance[member.id] || {
                  leadsAssigned: 0,
                  leadsConverted: 0,
                  leadsNew: 0,
                  leadsContacted: 0,
                  leadsFollowUp: 0,
                  leadsLost: 0,
                  totalRevenue: 0,
                  tasksCompleted: 0,
                  tasksTotal: 0
                };
                
                const conversionRate = performance.leadsAssigned > 0 
                  ? Math.round((performance.leadsConverted / performance.leadsAssigned) * 100)
                  : 0;

                return (
                  <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getRoleIcon(member.role)}</span>
                          <h3 className="text-white font-medium text-lg">{member.name}</h3>
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
                      {canManageTeam && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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
                    </div>

                    {/* Enhanced Performance Metrics */}
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
                        <p className="text-slate-400 text-xs">Revenue</p>
                        <p className="text-green-400 font-medium">
                          ₹{performance.totalRevenue >= 1000 
                            ? `${(performance.totalRevenue / 1000).toFixed(1)}k` 
                            : performance.totalRevenue.toLocaleString()
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Conversion Rate</p>
                        <p className="text-white font-medium">{conversionRate}%</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Performance</span>
                        <span>{conversionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(conversionRate, 100)}%` }}
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
                        Debug: Member ID: {member.id.slice(0, 8)}... | Email: {member.email}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {canManageTeam && (
        <AddTeamMemberModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};

export default Team;