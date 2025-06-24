
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const Calendar = () => {
  const appointments = [
    { id: 1, title: "Demo with John Smith", time: "09:00 AM", duration: "30 min", type: "Demo" },
    { id: 2, title: "Follow-up call with Emma", time: "11:00 AM", duration: "15 min", type: "Call" },
    { id: 3, title: "Contract review with Mike", time: "02:00 PM", duration: "45 min", type: "Meeting" },
    { id: 4, title: "Proposal presentation", time: "04:00 PM", duration: "60 min", type: "Presentation" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Calendar & Appointments</h1>
            <p className="text-slate-400">Manage your schedule and upcoming meetings</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Today</button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700">Week</button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700">Month</button>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Today's Appointments</h3>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{appointment.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.time}
                            </div>
                            <span>{appointment.duration}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.type === 'Demo' ? 'bg-blue-500/20 text-blue-400' :
                          appointment.type === 'Call' ? 'bg-green-500/20 text-green-400' :
                          appointment.type === 'Meeting' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {appointment.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Today's Meetings</span>
                    <span className="text-white font-medium">4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">This Week</span>
                    <span className="text-white font-medium">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Next Week</span>
                    <span className="text-white font-medium">8</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Upcoming</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="text-white">Team Standup</p>
                    <p className="text-slate-400">Tomorrow, 9:00 AM</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-white">Client Review</p>
                    <p className="text-slate-400">Thursday, 2:00 PM</p>
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

export default Calendar;
