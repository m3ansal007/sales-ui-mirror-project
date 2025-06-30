
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Lead } from '@/hooks/useLeads';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface LeadsTableProps {
  leads: Lead[];
  teamMembers: TeamMember[];
  selectedLeads: string[];
  userRole: string;
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectLead: (leadId: string, checked: boolean) => void;
  onIndividualAssign: (leadId: string, teamMemberId: string) => void;
  getStatusColor: (status: string) => string;
  getAssignedTeamMemberName: (teamMemberId: string | undefined) => string;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  teamMembers,
  selectedLeads,
  userRole,
  isAllSelected,
  onSelectAll,
  onSelectLead,
  onIndividualAssign,
  getStatusColor,
  getAssignedTeamMemberName
}) => {
  const canManageAssignments = userRole === 'Admin' || userRole === 'Sales Manager';

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-800">
          {canManageAssignments && (
            <TableHead className="text-slate-300 w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className="border-slate-600"
              />
            </TableHead>
          )}
          <TableHead className="text-slate-300">Name</TableHead>
          <TableHead className="text-slate-300">Company</TableHead>
          <TableHead className="text-slate-300">Contact</TableHead>
          <TableHead className="text-slate-300">Status</TableHead>
          <TableHead className="text-slate-300">Currently Assigned</TableHead>
          {canManageAssignments && (
            <TableHead className="text-slate-300">Assign To</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id} className="border-slate-800 hover:bg-slate-800/50">
            {canManageAssignments && (
              <TableCell>
                <Checkbox
                  checked={selectedLeads.includes(lead.id)}
                  onCheckedChange={(checked) => onSelectLead(lead.id, checked as boolean)}
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
              {getAssignedTeamMemberName(lead.assigned_team_member_id)}
            </TableCell>
            {canManageAssignments && (
              <TableCell>
                <Select
                  value={lead.assigned_team_member_id || 'unassigned'}
                  onValueChange={(value) => onIndividualAssign(lead.id, value)}
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
  );
};
