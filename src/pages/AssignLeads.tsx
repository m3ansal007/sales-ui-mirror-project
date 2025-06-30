
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useLeads } from '@/hooks/useLeads';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AssignmentControls } from '@/components/assign-leads/AssignmentControls';
import { LeadsTable } from '@/components/assign-leads/LeadsTable';
import { SelectionSummary } from '@/components/assign-leads/SelectionSummary';
import { AssignedLeadsSection } from '@/components/AssignedLeadsSection';

const AssignLeads = () => {
  const { user, userRole } = useAuth();
  const { leads, assignedLeads, loading: leadsLoading, updateLead, refetch } = useLeads(user, userRole);
  const { teamMembers, loading: teamLoading, refetch: refetchTeamMembers } = useTeamMembers();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // Force refresh team members when component mounts
  useEffect(() => {
    console.log('AssignLeads mounted, refreshing data...');
    refetchTeamMembers();
    refetch();
  }, [refetchTeamMembers, refetch]);

  // Sales Associate sees only their assigned leads
  if (userRole === 'Sales Associate') {
    return (
      <div className="min-h-screen bg-slate-950 flex">
        <Sidebar />
        
        <div className="flex-1 overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Assigned Leads to You</h1>
              <p className="text-slate-400">Leads assigned to you by managers or admins</p>
            </div>

            {leadsLoading ? (
              <div className="text-center text-slate-400">Loading assigned leads...</div>
            ) : (
              <AssignedLeadsSection
                assignedLeads={assignedLeads}
                onEditLead={() => {}} // Sales associates can't edit from this view
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin/Sales Manager view with assignment capabilities
  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select leads to assign",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTeamMember) {
      toast({
        title: "No team member selected",
        description: "Please select a team member to assign leads to",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const leadId of selectedLeads) {
        try {
          console.log(`Assigning lead ${leadId} to team member ${selectedTeamMember}`);
          const success = await updateLead(leadId, {
            assigned_team_member_id: selectedTeamMember
          });
          if (success) {
            successCount++;
            console.log(`Successfully assigned lead ${leadId}`);
          } else {
            errorCount++;
            console.log(`Failed to assign lead ${leadId}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error assigning lead ${leadId}:`, error);
        }
      }

      // Clear selections
      setSelectedLeads([]);
      setSelectedTeamMember('');

      // Force refresh to show updated assignments
      await refetch();

      // Show result toast
      if (successCount > 0) {
        toast({
          title: "Leads assigned",
          description: `Successfully assigned ${successCount} lead${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed to assign.` : '.'}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Assignment failed",
          description: `Failed to assign ${errorCount} lead${errorCount > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Bulk assign error:', error);
      toast({
        title: "Error",
        description: "An error occurred while assigning leads",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleIndividualAssign = async (leadId: string, teamMemberId: string) => {
    console.log(`Individual assign: lead ${leadId} to team member ${teamMemberId}`);
    
    const assignValue = teamMemberId === 'unassigned' ? null : teamMemberId;
    
    try {
      const success = await updateLead(leadId, {
        assigned_team_member_id: assignValue
      });
      
      if (success) {
        console.log(`Successfully assigned lead ${leadId} to ${teamMemberId}`);
        toast({
          title: "Lead assigned",
          description: assignValue ? "Lead assigned successfully" : "Lead unassigned successfully",
        });
        
        // Force refresh to show updated assignments
        await refetch();
      } else {
        console.log(`Failed to assign lead ${leadId}`);
      }
    } catch (error) {
      console.error(`Error assigning lead ${leadId}:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500/20 text-blue-400';
      case 'Contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'Follow-Up': return 'bg-orange-500/20 text-orange-400';
      case 'Converted': return 'bg-green-500/20 text-green-400';
      case 'Lost': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getAssignedTeamMemberName = (teamMemberId: string | undefined) => {
    if (!teamMemberId) return 'Unassigned';
    
    const member = teamMembers.find(tm => tm.id === teamMemberId);
    return member ? member.name : 'Unknown Member';
  };

  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;

  // Debug logging
  console.log('AssignLeads render:', {
    leadsCount: leads.length,
    teamMembersCount: teamMembers.length,
    userRole,
    loading: leadsLoading || teamLoading
  });

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Assign Leads</h1>
            <p className="text-slate-400">Assign leads to team members for better management</p>
          </div>

          <AssignmentControls
            selectedLeads={selectedLeads}
            selectedTeamMember={selectedTeamMember}
            setSelectedTeamMember={setSelectedTeamMember}
            teamMembers={teamMembers}
            isAssigning={isAssigning}
            onBulkAssign={handleBulkAssign}
          />

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {leadsLoading || teamLoading ? (
              <div className="p-8 text-center text-slate-400">Loading leads and team members...</div>
            ) : (
              <LeadsTable
                leads={leads}
                teamMembers={teamMembers}
                selectedLeads={selectedLeads}
                userRole={userRole}
                isAllSelected={isAllSelected}
                onSelectAll={handleSelectAll}
                onSelectLead={handleSelectLead}
                onIndividualAssign={handleIndividualAssign}
                getStatusColor={getStatusColor}
                getAssignedTeamMemberName={getAssignedTeamMemberName}
              />
            )}
            
            {!leadsLoading && !teamLoading && leads.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No leads found to assign.
              </div>
            )}
          </div>

          <SelectionSummary
            selectedCount={selectedLeads.length}
            onClearSelection={() => setSelectedLeads([])}
          />
        </div>
      </div>
    </div>
  );
};

export default AssignLeads;
