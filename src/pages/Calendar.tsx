
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { useAppointments } from "@/hooks/useAppointments";
import { useLeads } from "@/hooks/useLeads";
import { AddAppointmentModal } from "@/components/AddAppointmentModal";

const Calendar = () => {
  const { appointments, loading, createAppointment } = useAppointments();
  const { leads } = useLeads();
  const [showAddModal, setShowAddModal] = useState(false);

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : null;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `${diffMins} min`;
  };

  // Filter today's appointments
  const today = new Date().toDateString();
  const todayAppointments = appointments.filter(apt => 
    new Date(apt.start_time).toDateString() === today
  );

  // Calculate upcoming appointments for this week
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  const thisWeekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_time);
    return aptDate >= thisWeekStart && aptDate <= thisWeekEnd;
  });

  // Calculate next week appointments
  const nextWeekStart = new Date(thisWeekEnd);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  const nextWeekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_time);
    return aptDate >= nextWeekStart && aptDate <= nextWeekEnd;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Demo': return 'bg-blue-500/20 text-blue-400';
      case 'Call': return 'bg-green-500/20 text-green-400';
      case 'Meeting': return 'bg-purple-500/20 text-purple-400';
      case 'Presentation': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

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
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Today's Appointments</h3>
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Loading appointments...</div>
                ) : todayAppointments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No appointments scheduled for today
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{appointment.title}</h4>
                            {appointment.lead_id && (
                              <p className="text-slate-400 text-sm">with {getLeadName(appointment.lead_id)}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(appointment.start_time)}
                              </div>
                              <span>{calculateDuration(appointment.start_time, appointment.end_time)}</span>
                              {appointment.location && <span>{appointment.location}</span>}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                            {appointment.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Today's Meetings</span>
                    <span className="text-white font-medium">{todayAppointments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">This Week</span>
                    <span className="text-white font-medium">{thisWeekAppointments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Next Week</span>
                    <span className="text-white font-medium">{nextWeekAppointments.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Upcoming</h3>
                <div className="space-y-2">
                  {appointments
                    .filter(apt => new Date(apt.start_time) > new Date())
                    .slice(0, 3)
                    .map((appointment) => (
                      <div key={appointment.id} className="text-sm">
                        <p className="text-white">{appointment.title}</p>
                        <p className="text-slate-400">
                          {new Date(appointment.start_time).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}, {formatTime(appointment.start_time)}
                        </p>
                      </div>
                    ))}
                  {appointments.filter(apt => new Date(apt.start_time) > new Date()).length === 0 && (
                    <p className="text-slate-400 text-sm">No upcoming appointments</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddAppointmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createAppointment}
      />
    </div>
  );
};

export default Calendar;
