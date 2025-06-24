
import { ChevronRight } from "lucide-react";

export const ActivityFeed = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Activity Feed</h2>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Recent Activity</h3>
          <button className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center h-32">
        <p className="text-slate-500">No recent activity</p>
      </div>
    </div>
  );
};
