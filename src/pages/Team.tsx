
import { Users, Plus, Mail, Phone, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import AddTeamMemberModal from "@/components/AddTeamMemberModal";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Button } from "@/components/ui/button";

const Team = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState('All Members');
  const { teamMembers, memberPerformance, loading, refetch, deleteTeamMember } = useTeamMembers();

  const filteredMembers = teamMembers.filter(member => {
    if (filter === 'All Members') return true;
    if (filter === 'Active') return member.status === 'Active';
    if (filter === 'Managers') return member.role.includes('Manager');
    return true;
  });

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      await deleteTeamMember(memberId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Team & Roles</h1>
            <p className="text-slate-400">Manage your sales team and track performance</p>
          </div>

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
                onClick={() => setFilter('Managers')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'Managers' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Managers
              </button>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Team Member
            </button>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading team members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No team members found</p>
              <p className="text-sm">
                {filter === 'All Members' 
                  ? 'Add your first team member to get started' 
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
                        <h3 className="text-white font-medium text-lg">{member.name}</h3>
                        <p className="text-slate-400 text-sm">{member.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                          member.status === 'Away' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {member.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                      <div>
                        <p className="text-slate-400 text-xs">Leads Assigned</p>
                        <p className="text-white font-medium">{performance.leadsAssigned}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Leads Converted</p>
                        <p className="text-green-400 font-medium">{performance.leadsConverted}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-slate-400 text-xs">Tasks Completed</p>
                        <p className="text-blue-400 font-medium">{performance.tasksCompleted}/{performance.tasksTotal}</p>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddTeamMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Team;
