
import { Phone, Mail, MessageCircle, Plus, Filter } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const CommunicationLogs = () => {
  const communications = [
    { 
      id: 1, 
      type: "call", 
      contact: "John Smith", 
      subject: "Follow-up call", 
      date: "2024-01-15", 
      time: "10:30 AM", 
      duration: "15 min",
      status: "Completed"
    },
    { 
      id: 2, 
      type: "email", 
      contact: "Emma Johnson", 
      subject: "Product demo proposal", 
      date: "2024-01-15", 
      time: "09:15 AM", 
      duration: null,
      status: "Sent"
    },
    { 
      id: 3, 
      type: "whatsapp", 
      contact: "Mike Davis", 
      subject: "Quick check-in", 
      date: "2024-01-14", 
      time: "04:20 PM", 
      duration: null,
      status: "Delivered"
    },
    { 
      id: 4, 
      type: "call", 
      contact: "Lisa Brown", 
      subject: "Contract discussion", 
      date: "2024-01-14", 
      time: "02:00 PM", 
      duration: "25 min",
      status: "Completed"
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "call": return Phone;
      case "email": return Mail;
      case "whatsapp": return MessageCircle;
      default: return MessageCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "call": return "bg-green-500/20 text-green-400";
      case "email": return "bg-blue-500/20 text-blue-400";
      case "whatsapp": return "bg-emerald-500/20 text-emerald-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Communication Logs</h1>
            <p className="text-slate-400">Track all your interactions with leads and clients</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">All</button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Calls
              </button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Emails
              </button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
            <div className="flex gap-2">
              <button className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                Log Activity
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">Type</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Contact</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Subject</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Date & Time</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Duration</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communications.map((comm) => {
                    const IconComponent = getIcon(comm.type);
                    return (
                      <tr key={comm.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${getTypeColor(comm.type)}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className="text-white capitalize">{comm.type}</span>
                          </div>
                        </td>
                        <td className="p-4 text-white">{comm.contact}</td>
                        <td className="p-4 text-slate-300">{comm.subject}</td>
                        <td className="p-4 text-slate-300">
                          <div>
                            <div>{comm.date}</div>
                            <div className="text-xs text-slate-400">{comm.time}</div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">{comm.duration || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            comm.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                            comm.status === 'Sent' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button className="text-blue-400 hover:text-blue-300 text-sm">View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationLogs;
