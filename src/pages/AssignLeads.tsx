import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLeads } from '@/hooks/useLeads';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserCheck, Users } from 'lucide-react';

const AssignLeads = () => {
  const { leads, loading: leadsLoading, updateLead } = useLeads();
  const { teamMembers, loading: teamLoading } = useTeamMembers();
  const { user, userRole } = useAuth();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

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

  const getAssignedTeamMemberName = (teamMemberId: string | undefined, leadId: string) => {
    if (!teamMemberId) return 'Unassigned';
    
    // Check if current user is a sales associate and this lead is assigned to them
    if (userRole === 'Sales Associate' && user) {
      // Find the current user's team member record
      const currentUserTeamMember = teamMembers.find(tm => tm.auth_user_id === user.id);
      if (currentUserTeamMember && currentUserTeamMember.id === teamMemberId) {
        return 'Assigned to you';
      }
    }
    
    const member = teamMembers.find(tm => tm.id === teamMemberId);
    return member ? member.name : 'Unknown';
  };

  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Assign Leads</h1>
            <p className="text-slate-400">Assign leads to team members for better management</p>
          </div>

          {/* Assignment Controls - Only show for Admin/Sales Manager */}
          {(userRole === 'Admin' || userRole === 'Sales Manager') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">Bulk Assignment</span>
                </div>
                <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                  <SelectTrigger className="w-64 bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkAssign}
                  disabled={isAssigning || selectedLeads.length === 0 || !selectedTeamMember}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {isAssigning ? 'Assigning...' : `Assign ${selectedLeads.length} Lead${selectedLeads.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {leadsLoading || teamLoading ? (
              <div className="p-8 text-center text-slate-400">Loading leads and team members...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    {(userRole === 'Admin' || userRole === 'Sales Manager') && (
                      <TableHead className="text-slate-300 w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="border-slate-600"
                        />
                      </TableHead>
                    )}
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Company</TableHead>
                    <TableHead className="text-slate-300">Contact</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Currently Assigned</TableHead>
                    {(userRole === 'Admin' || userRole === 'Sales Manager') && (
                      <TableHead className="text-slate-300">Assign To</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="border-slate-800 hover:bg-slate-800/50">
                      {(userRole === 'Admin' || userRole === 'Sales Manager') && (
                        <TableCell>
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                            className="border-slate-600"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-white font-medium">{lead.name}</TableCell>
                      <TableCell className="text-slate-300">{lead.company || '-'}</TableCell>
                      <TableCell className="text-slate-300">{lead.email || lead.phone || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {getAssignedTeamMemberName(lead.assigned_team_member_id, lead.id)}
                      </TableCell>
                      {(userRole === 'Admin' || userRole === 'Sales Manager') && (
                        <TableCell>
                          <Select
                            value={lead.assigned_team_member_id || ''}
                            onValueChange={(value) => handleIndividualAssign(lead.id, value)}
                          >
                            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                              <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {teamMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!leadsLoading && !teamLoading && leads.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No leads found to assign.
              </div>
            )}
          </div>

          {selectedLeads.length > 0 && (userRole === 'Admin' || userRole === 'Sales Manager') && (
            <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  onClick={() => setSelectedLeads([])}
                  className="border-slate-600 text-slate-300"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignLeads;
