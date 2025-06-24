
import { TrendingUp, DollarSign } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const SalesPipeline = () => {
  const pipelineStages = [
    { name: "New", count: 25, value: "$125,000", color: "bg-blue-500" },
    { name: "Contacted", count: 18, value: "$90,000", color: "bg-yellow-500" },
    { name: "Follow-Up", count: 12, value: "$60,000", color: "bg-orange-500" },
    { name: "Converted", count: 8, value: "$40,000", color: "bg-green-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sales Pipeline</h1>
            <p className="text-slate-400">Track your sales progress and conversion rates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {pipelineStages.map((stage, index) => (
              <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">{stage.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{stage.count}</p>
                  <p className="text-slate-400 text-sm">Leads</p>
                  <div className="flex items-center gap-1 text-green-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">{stage.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <h3 className="text-white font-medium mb-4">Pipeline Overview</h3>
            <div className="flex items-center gap-2 mb-4">
              {pipelineStages.map((stage, index) => (
                <div key={index} className="flex-1">
                  <div className={`h-8 ${stage.color} rounded-lg flex items-center justify-center text-white text-sm font-medium`}>
                    {stage.count}
                  </div>
                  <p className="text-slate-400 text-xs text-center mt-1">{stage.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Conversion Rates</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">New → Contacted</span>
                  <span className="text-green-400 font-medium">72%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Contacted → Follow-Up</span>
                  <span className="text-green-400 font-medium">67%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Follow-Up → Converted</span>
                  <span className="text-green-400 font-medium">67%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Pipeline Value</span>
                  <span className="text-white font-medium">$315,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Average Deal Size</span>
                  <span className="text-white font-medium">$5,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Close Rate</span>
                  <span className="text-green-400 font-medium">32%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPipeline;
