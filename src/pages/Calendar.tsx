
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
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');

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

  // Handle appointment creation - wrap createAppointment to return void
  const handleCreateAppointment = async (data: any) => {
    await createAppointment(data);
  };

  // Filter appointments based on view mode
  const getFilteredAppointments = () => {
    const now = new Date();
    
    switch (viewMode) {
      case 'today':
        const today = now.toDateString();
        return appointments.filter(apt => 
          new Date(apt.start_time).toDateString() === today
        );
      
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        return appointments.filter(apt => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= weekStart && aptDate <= weekEnd;
        });
      
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        return appointments.filter(apt => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= monthStart && aptDate <= monthEnd;
        });
      
      default:
        return appointments;
    }
  };

  const filteredAppointments = getFilteredAppointments();

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

  const getViewTitle = () => {
    switch (viewMode) {
      case 'today': return "Today's Appointments";
      case 'week': return "This Week's Appointments";
      case 'month': return "This Month's Appointments";
      default: return "Appointments";
    }
  };

  // Group appointments by date for week and month views
  const groupAppointmentsByDate = (appointments: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    appointments.forEach(apt => {
      const dateKey = new Date(apt.start_time).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    return grouped;
  };

  const groupedAppointments = groupAppointmentsByDate(filteredAppointments);

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
              <button 
                onClick={() => setViewMode('today')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'today' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Today
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Month
              </button>
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
                <h3 className="text-white font-medium mb-4">{getViewTitle()}</h3>
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Loading appointments...</div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No appointments scheduled for this {viewMode}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewMode === 'today' ? (
                      // Today view - show appointments directly
                      filteredAppointments.map((appointment) => (
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
                      ))
                    ) : (
                      // Week/Month view - group by date
                      Object.entries(groupedAppointments)
                        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                        .map(([date, dateAppointments]) => (
                          <div key={date} className="mb-6">
                            <h4 className="text-white font-medium mb-3 border-b border-slate-700 pb-2">
                              {new Date(date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </h4>
                            <div className="space-y-2">
                              {dateAppointments.map((appointment) => (
                                <div key={appointment.id} className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-white font-medium text-sm">{appointment.title}</h5>
                                      {appointment.lead_id && (
                                        <p className="text-slate-400 text-xs">with {getLeadName(appointment.lead_id)}</p>
                                      )}
                                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
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
                          </div>
                        ))
                    )}
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
                    <span className="text-white font-medium">
                      {appointments.filter(apt => 
                        new Date(apt.start_time).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
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
        onSubmit={handleCreateAppointment}
      />
    </div>
  );
};

export default Calendar;
