import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar, MessageSquare } from 'lucide-react';
import { AddLeadModal } from '@/components/AddLeadModal';
import { AddTaskModal } from '@/components/AddTaskModal';
import { AddAppointmentModal } from '@/components/AddAppointmentModal';
import { useLeads } from '@/hooks/useLeads';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';

export const QuickActions = () => {
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  
  const { createLead } = useLeads();
  const { createTask } = useTasks();
  const { createAppointment } = useAppointments();

  const handleAddLead = async (leadData: any) => {
    console.log('Submitting lead data from dashboard:', leadData);
    
    try {
      const success = await createLead(leadData);
      console.log('Lead creation result from dashboard:', success);
      
      if (success) {
        console.log('Lead created successfully, closing modal and reloading page');
        setShowAddLead(false);
        
        // Reload the page after successful lead creation
        window.location.reload();
      }
      
      return success;
    } catch (error) {
      console.error('Error in handleAddLead:', error);
      return false;
    }
  };

  const handleAddAppointment = async (appointmentData: any) => {
    try {
      await createAppointment(appointmentData);
      setShowAddAppointment(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const quickActions = [
    { label: "Add Lead", icon: Plus },
    { label: "Follow-ups", icon: Calendar },
    { label: "Search", icon: Users }
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "Add Lead":
        // Just open the modal, don't reload immediately
        setShowAddLead(true);
        break;
      case "Follow-ups":
        window.location.href = '/tasks?filter=Due Today';
        break;
      case "Search":
        // Focus on the search input
        const searchInput = document.querySelector('input[placeholder*="Ask AI"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.placeholder = "Search leads, tasks, or ask AI...";
        }
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            onClick={() => handleQuickAction("Add Lead")}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
          <Button 
            onClick={() => setShowAddTask(true)}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Add Task
          </Button>
          <Button 
            onClick={() => setShowAddAppointment(true)}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <AddLeadModal
        isOpen={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSubmit={handleAddLead}
      />

      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={createTask}
      />

      <AddAppointmentModal
        isOpen={showAddAppointment}
        onClose={() => setShowAddAppointment(false)}
        onSubmit={handleAddAppointment}
      />
    </>
  );
};