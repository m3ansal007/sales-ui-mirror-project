
import { Users, Search, Filter, Plus } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AddLeadModal } from "@/components/AddLeadModal";

const AllLeads = () => {
  const [showAddLead, setShowAddLead] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const leads = [
    { id: 1, name: "John Smith", email: "john@example.com", phone: "+1234567890", source: "LinkedIn", status: "New", assignedTo: "Sarah Johnson" },
    { id: 2, name: "Emma Johnson", email: "emma@example.com", phone: "+1234567891", source: "Website", status: "Contacted", assignedTo: "Mike Davis" },
    { id: 3, name: "Mike Davis", email: "mike@example.com", phone: "+1234567892", source: "Referral", status: "Follow-Up", assignedTo: "Lisa Brown" },
    { id: 4, name: "Lisa Brown", email: "lisa@example.com", phone: "+1234567893", source: "Cold Call", status: "Converted", assignedTo: "John Smith" },
  ];

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">All Leads</h1>
            <p className="text-slate-400">Manage and track all your sales leads</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            <button 
              onClick={() => setShowAddLead(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Lead
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">Name</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Email</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Phone</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Source</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Assigned To</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                      <td className="p-4 text-white">{lead.name}</td>
                      <td className="p-4 text-slate-300">{lead.email}</td>
                      <td className="p-4 text-slate-300">{lead.phone}</td>
                      <td className="p-4 text-slate-300">{lead.source}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                          lead.status === 'Contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                          lead.status === 'Follow-Up' ? 'bg-orange-500/20 text-orange-400' :
                          lead.status === 'Converted' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{lead.assignedTo}</td>
                      <td className="p-4">
                        <button className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AddLeadModal 
        isOpen={showAddLead} 
        onClose={() => setShowAddLead(false)} 
      />
    </div>
  );
};

export default AllLeads;
