
import { ChevronRight, Plus, User, Phone, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { AddLeadModal } from "@/components/AddLeadModal";

export const LeadActivityFeed = () => {
  const [showAddLead, setShowAddLead] = useState(false);

  const activities = [
    {
      type: "new_lead",
      message: "New Lead added by Sarah",
      lead: "John Smith - LinkedIn",
      time: "2 mins ago",
      icon: User,
      color: "text-blue-400"
    },
    {
      type: "follow_up",
      message: "Follow-up completed for",
      lead: "Emma Johnson",
      time: "15 mins ago",
      icon: Phone,
      color: "text-green-400"
    },
    {
      type: "status_change",
      message: "Lead status changed:",
      lead: "Mike Davis ➝ Contacted",
      time: "1 hour ago",
      icon: MessageCircle,
      color: "text-yellow-400"
    },
    {
      type: "email_sent",
      message: "Email sent to",
      lead: "Lisa Brown",
      time: "2 hours ago",
      icon: Mail,
      color: "text-purple-400"
    }
  ];

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          <button 
            onClick={() => setShowAddLead(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Lead
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Live Updates</h3>
            <button className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
              <div className={`p-1 rounded ${activity.color}`}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-slate-300 text-sm">
                  {activity.message} <span className="text-white font-medium">{activity.lead}</span>
                </p>
                <p className="text-slate-500 text-xs mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddLeadModal 
        isOpen={showAddLead} 
        onClose={() => setShowAddLead(false)} 
      />
    </>
  );
};
