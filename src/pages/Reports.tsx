
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const Reports = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
            <p className="text-slate-400">Analyze your sales performance and team metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Leads</p>
                <p className="text-white text-2xl font-bold mb-1">247</p>
                <p className="text-green-400 text-xs">+12% this month</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Conversion Rate</p>
                <p className="text-white text-2xl font-bold mb-1">32%</p>
                <p className="text-green-400 text-xs">+5% this month</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Revenue</p>
                <p className="text-white text-2xl font-bold mb-1">$89k</p>
                <p className="text-green-400 text-xs">+18% this month</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg. Deal Size</p>
                <p className="text-white text-2xl font-bold mb-1">$5.2k</p>
                <p className="text-green-400 text-xs">+8% this month</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Lead Sources Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">LinkedIn</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-white text-sm">65%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Website</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-white text-sm">45%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Referrals</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                    <span className="text-white text-sm">35%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cold Calls</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <span className="text-white text-sm">25%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Team Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Sarah Johnson</p>
                    <p className="text-slate-400 text-sm">89 leads converted</p>
                  </div>
                  <span className="text-green-400 font-medium">$45k</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Mike Davis</p>
                    <p className="text-slate-400 text-sm">76 leads converted</p>
                  </div>
                  <span className="text-green-400 font-medium">$38k</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Lisa Brown</p>
                    <p className="text-slate-400 text-sm">64 leads converted</p>
                  </div>
                  <span className="text-green-400 font-medium">$32k</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">John Smith</p>
                    <p className="text-slate-400 text-sm">52 leads converted</p>
                  </div>
                  <span className="text-green-400 font-medium">$26k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
