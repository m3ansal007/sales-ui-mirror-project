
import { Plus } from "lucide-react";

interface TeamFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  canManageTeam: boolean;
  onAddTeamMember: () => void;
}

export const TeamFilters = ({ filter, setFilter, canManageTeam, onAddTeamMember }: TeamFiltersProps) => {
  const filters = [
    { key: 'All Members', label: 'All Members' },
    { key: 'Active', label: 'Active' },
    { key: 'Sales Managers', label: 'Sales Managers' },
    { key: 'Sales Associates', label: 'Sales Associates' }
  ];

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-4">
        {filters.map((filterOption) => (
          <button 
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`px-4 py-2 rounded-lg ${
              filter === filterOption.key 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>
      {canManageTeam && (
        <button 
          onClick={onAddTeamMember}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Team Member
        </button>
      )}
    </div>
  );
};
