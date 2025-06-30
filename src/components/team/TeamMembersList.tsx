
import { Users } from "lucide-react";
import { useState } from "react";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamMember, MemberPerformance, MemberActivity } from "@/hooks/useTeamMembers";

interface TeamMembersListProps {
  filteredMembers: TeamMember[];
  memberPerformance: Record<string, MemberPerformance>;
  memberActivities: Record<string, MemberActivity[]>;
  loading: boolean;
  filter: string;
  canManageTeam: boolean;
  userRole: string;
  onDeleteMember: (memberId: string, memberName: string) => void;
}

export const TeamMembersList = ({ 
  filteredMembers, 
  memberPerformance, 
  memberActivities, 
  loading, 
  filter, 
  canManageTeam, 
  userRole,
  onDeleteMember 
}: TeamMembersListProps) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading team members...</div>;
  }

  if (filteredMembers.length === 0) {
    return (
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
    );
  }

  return (
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
          lastActivity: 'No activity',
          performanceScore: 0
        };

        const activities = memberActivities[member.id] || [];
        const isExpanded = selectedMember === member.id;

        return (
          <TeamMemberCard
            key={member.id}
            member={member}
            performance={performance}
            activities={activities}
            isExpanded={isExpanded}
            canManageTeam={canManageTeam}
            userRole={userRole}
            onToggleExpand={() => setSelectedMember(isExpanded ? null : member.id)}
            onDelete={onDeleteMember}
          />
        );
      })}
    </div>
  );
};
