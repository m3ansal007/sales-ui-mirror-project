
import { ChevronDown, BarChart3, Users, Calendar, Settings, PieChart, Target, MessageSquare, Briefcase, Phone, Mail, MessageCircle, UserPlus, GitPullRequest } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    leads: false,
    communication: false,
    leadStages: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={cn(
      "bg-slate-900 border-r border-slate-800 h-screen transition-all duration-300 flex flex-col overflow-y-auto",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && <span className="font-semibold text-white">Lead Manager</span>}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-90")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 border border-purple-500/30">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              {!isCollapsed && <span className="text-white font-medium">Dashboard</span>}
            </div>
          </div>

          {/* Leads Section */}
          <div>
            <button
              onClick={() => toggleSection('leads')}
              className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              <Users className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>Leads</span>
                  <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", expandedSections.leads && "rotate-180")} />
                </>
              )}
            </button>
            {expandedSections.leads && !isCollapsed && (
              <div className="ml-6 space-y-1 mt-2">
                <button className="w-full text-left p-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded">All Leads</button>
                <button className="w-full text-left p-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center gap-2">
                  <UserPlus className="w-3 h-3" />
                  Add New Lead
                </button>
                <button
                  onClick={() => toggleSection('leadStages')}
                  className="w-full text-left p-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-between"
                >
                  Lead Stages
                  <ChevronDown className={cn("w-3 h-3 transition-transform", expandedSections.leadStages && "rotate-180")} />
                </button>
                {expandedSections.leadStages && (
                  <div className="ml-4 space-y-1">
                    <div className="p-2 text-xs text-slate-500">• New</div>
                    <div className="p-2 text-xs text-slate-500">• Contacted</div>
                    <div className="p-2 text-xs text-slate-500">• Follow-Up</div>
                    <div className="p-2 text-xs text-slate-500">• Converted</div>
                    <div className="p-2 text-xs text-slate-500">• Lost</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tasks & Follow-Ups */}
          <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
            <GitPullRequest className="w-4 h-4" />
            {!isCollapsed && <span>Tasks & Follow-Ups</span>}
          </button>

          {/* Communication Logs */}
          <div>
            <button
              onClick={() => toggleSection('communication')}
              className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              <MessageSquare className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>Communication Logs</span>
                  <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", expandedSections.communication && "rotate-180")} />
                </>
              )}
            </button>
            {expandedSections.communication && !isCollapsed && (
              <div className="ml-6 space-y-1 mt-2">
                <button className="w-full text-left p-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  Calls
                </button>
                <button className="w-full text-left p-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Emails
                </button>
                <button className="w-full text-left p-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Sales Pipeline */}
          <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
            <PieChart className="w-4 h-4" />
            {!isCollapsed && <span>Sales Pipeline</span>}
          </button>

          {/* Calendar & Appointments */}
          <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
            <Calendar className="w-4 h-4" />
            {!isCollapsed && <span>Calendar & Appointments</span>}
          </button>

          {/* Reports & Analytics */}
          <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
            <BarChart3 className="w-4 h-4" />
            {!isCollapsed && <span>Reports & Analytics</span>}
          </button>

          {/* Team & Roles */}
          <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
            <Briefcase className="w-4 h-4" />
            {!isCollapsed && <span>Team & Roles</span>}
          </button>

          {/* Settings */}
          <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
