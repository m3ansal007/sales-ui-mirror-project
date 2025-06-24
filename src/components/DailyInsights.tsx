
import { Mail, GitPullRequest, AlertTriangle } from "lucide-react";

export const DailyInsights = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Daily Insights</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-sm">Unread Emails</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">+3 since yesterday</p>
            <p className="text-white text-2xl font-bold">12</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitPullRequest className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-sm">Open Proposals</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">2 need review</p>
            <p className="text-white text-2xl font-bold">5</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-slate-400 text-sm">Action Items</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">3 high priority</p>
            <p className="text-white text-2xl font-bold">8</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
            <span className="text-xs">✨</span>
          </div>
          <h3 className="text-white font-medium">AI Insights & Alerts</h3>
        </div>
        
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">Sprint Backend API Integration is at risk of delay</span>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">✦</span>
              </div>
              <span className="text-blue-300 text-sm">Sales team workload is above average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
