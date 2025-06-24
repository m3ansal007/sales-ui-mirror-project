
import { Users, AlertTriangle, Clock, Flame } from "lucide-react";

export const LeadInsights = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Today's Overview</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-sm">New Leads</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">+5 since yesterday</p>
            <p className="text-white text-2xl font-bold">8</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-slate-400 text-sm">Unattended</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">Needs attention</p>
            <p className="text-white text-2xl font-bold">3</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400 text-sm">Follow-ups</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">Due today</p>
            <p className="text-white text-2xl font-bold">7</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-slate-400 text-sm">High-Intent</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">Ready to convert</p>
            <p className="text-white text-2xl font-bold">4</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
            <span className="text-xs">🤖</span>
          </div>
          <h3 className="text-white font-medium">AI Insights & Alerts</h3>
        </div>
        
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">3 Hot Leads not contacted in 48 hrs</span>
            </div>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-black">⚡</span>
              </div>
              <span className="text-yellow-300 text-sm">LinkedIn leads converting 2x better</span>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">✓</span>
              </div>
              <span className="text-green-300 text-sm">Team member has 10 pending follow-ups</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
