
import { ChevronDown, BarChart3, Users, Calendar, Settings, PieChart, Target, MessageSquare, Briefcase } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    aiAssistant: false,
    salesManagement: false,
    meetings: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={cn(
      "bg-slate-900 border-r border-slate-800 h-screen transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && <span className="font-semibold text-white">Sales OS</span>}
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

          <div>
            <button
              onClick={() => toggleSection('aiAssistant')}
              className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              <MessageSquare className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>AI Assistant</span>
                  <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", expandedSections.aiAssistant && "rotate-180")} />
                </>
              )}
            </button>
          </div>

          <div>
            <button
              onClick={() => toggleSection('salesManagement')}
              className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              <Briefcase className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>Sales Management</span>
                  <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", expandedSections.salesManagement && "rotate-180")} />
                </>
              )}
            </button>
          </div>

          <div>
            <button
              onClick={() => toggleSection('meetings')}
              className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              <Calendar className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>Meetings</span>
                  <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", expandedSections.meetings && "rotate-180")} />
                </>
              )}
            </button>
          </div>

          <button className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300">
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
