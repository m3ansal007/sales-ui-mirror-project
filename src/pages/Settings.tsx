
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const Settings = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Manage your account and system preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Settings Categories</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 text-white">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors">
                    <Shield className="w-4 h-4" />
                    Security
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors">
                    <Database className="w-4 h-4" />
                    Data & Privacy
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors">
                    <Palette className="w-4 h-4" />
                    Appearance
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-6">Profile Settings</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                      <input
                        type="text"
                        defaultValue="John"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue="Doe"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="john.doe@company.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="admin">Administrator</option>
                      <option value="manager">Sales Manager</option>
                      <option value="rep">Sales Representative</option>
                      <option value="associate">Sales Associate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Time Zone</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="est">Eastern Time (EST)</option>
                      <option value="cst">Central Time (CST)</option>
                      <option value="mst">Mountain Time (MST)</option>
                      <option value="pst">Pacific Time (PST)</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                      Save Changes
                    </button>
                    <button className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
