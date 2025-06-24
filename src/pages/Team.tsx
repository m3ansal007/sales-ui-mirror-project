
import { Users, Plus, Mail, Phone } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const Team = () => {
  const teamMembers = [
    { 
      id: 1, 
      name: "Sarah Johnson", 
      role: "Sales Manager", 
      email: "sarah@company.com", 
      phone: "+1234567890",
      leadsAssigned: 89,
      leadsConverted: 45,
      status: "Active"
    },
    { 
      id: 2, 
      name: "Mike Davis", 
      role: "Sales Representative", 
      email: "mike@company.com", 
      phone: "+1234567891",
      leadsAssigned: 76,
      leadsConverted: 38,
      status: "Active"
    },
    { 
      id: 3, 
      name: "Lisa Brown", 
      role: "Sales Representative", 
      email: "lisa@company.com", 
      phone: "+1234567892",
      leadsAssigned: 64,
      leadsConverted: 32,
      status: "Active"
    },
    { 
      id: 4, 
      name: "John Smith", 
      role: "Sales Associate", 
      email: "john@company.com", 
      phone: "+1234567893",
      leadsAssigned: 52,
      leadsConverted: 26,
      status: "Away"
    },
  ];

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
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">All Members</button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700">Active</button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700">Managers</button>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Add Team Member
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-medium text-lg">{member.name}</h3>
                    <p className="text-slate-400 text-sm">{member.role}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {member.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-slate-400 text-xs">Leads Assigned</p>
                    <p className="text-white font-medium">{member.leadsAssigned}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Leads Converted</p>
                    <p className="text-green-400 font-medium">{member.leadsConverted}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Conversion Rate</span>
                    <span>{Math.round((member.leadsConverted / member.leadsAssigned) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(member.leadsConverted / member.leadsAssigned) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
