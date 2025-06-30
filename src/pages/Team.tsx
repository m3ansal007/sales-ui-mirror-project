
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import AddTeamMemberModal from "@/components/AddTeamMemberModal";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { TeamStats } from "@/components/team/TeamStats";
import { TeamFilters } from "@/components/team/TeamFilters";
import { TeamMembersList } from "@/components/team/TeamMembersList";

const Team = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState('All Members');
  const { teamMembers, memberPerformance, memberActivities, loading, refetch, deleteTeamMember } = useTeamMembers();
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

  // Check if user has permission to manage team
  const canManageTeam = userRole === 'Admin' || userRole === 'Sales Manager';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Team & Roles</h1>
            <p className="text-slate-400">Manage your sales team and track comprehensive performance metrics (Currency: Indian Rupees ₹)</p>
            {!canManageTeam && (
              <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ You have view-only access to team information. Contact your admin to manage team members.
                </p>
              </div>
            )}
          </div>

          <TeamStats 
            memberPerformance={memberPerformance} 
            teamMembersCount={teamMembers.length} 
          />

          <TeamFilters
            filter={filter}
            setFilter={setFilter}
            canManageTeam={canManageTeam}
            onAddTeamMember={() => setIsAddModalOpen(true)}
          />

          <TeamMembersList
            filteredMembers={filteredMembers}
            memberPerformance={memberPerformance}
            memberActivities={memberActivities}
            loading={loading}
            filter={filter}
            canManageTeam={canManageTeam}
            userRole={userRole}
            onDeleteMember={handleDeleteMember}
          />
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
