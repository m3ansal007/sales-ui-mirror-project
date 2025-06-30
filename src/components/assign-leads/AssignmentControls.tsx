
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface AssignmentControlsProps {
  selectedLeads: string[];
  selectedTeamMember: string;
  setSelectedTeamMember: (value: string) => void;
  teamMembers: TeamMember[];
  isAssigning: boolean;
  onBulkAssign: () => void;
}

export const AssignmentControls: React.FC<AssignmentControlsProps> = ({
  selectedLeads,
  selectedTeamMember,
  setSelectedTeamMember,
  teamMembers,
  isAssigning,
  onBulkAssign
}) => {
  return (
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
          onClick={onBulkAssign}
          disabled={isAssigning || selectedLeads.length === 0 || !selectedTeamMember}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Users className="w-4 h-4 mr-2" />
          {isAssigning ? 'Assigning...' : `Assign ${selectedLeads.length} Lead${selectedLeads.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};
