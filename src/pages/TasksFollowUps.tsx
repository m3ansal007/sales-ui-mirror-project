import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddTaskModal } from '@/components/AddTaskModal';
import { Plus, Calendar, Clock, CheckCircle2, AlertCircle, User, Phone, Mail, Building } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  due_date?: string;
  created_at: string;
  completed_at?: string;
  lead_id?: string;
  user_id: string;
  lead?: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
}

const TasksFollowUps = () => {
  const { user, userRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          lead:leads(name, email, phone, company)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const createTask = async (taskData: any) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      await fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task ${status === 'completed' ? 'completed' : 'updated'} successfully`,
      });

      await fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      await fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const getFilteredTasks = () => {
    const now = new Date();
    
    switch (filter) {
      case 'pending':
        return tasks.filter(task => task.status === 'pending');
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      case 'overdue':
        return tasks.filter(task => 
          task.status === 'pending' && 
          task.due_date && 
          new Date(task.due_date) < now
        );
      default:
        return tasks;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-400 bg-red-500/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'Low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Tasks & Follow-ups</h1>
              <p className="text-slate-400">Manage your tasks and follow-up activities</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-6">
            {[
              { key: 'all', label: 'All Tasks', count: tasks.length },
              { key: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
              { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
              { key: 'overdue', label: 'Overdue', count: tasks.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date()).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No tasks found for the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-6 hover:bg-slate-800/50 transition-colors ${
                      isOverdue(task) ? 'border-l-4 border-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="text-white font-medium">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                            {task.type}
                          </span>
                          {isOverdue(task) && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                              Overdue
                            </span>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-slate-400 text-sm mb-3">{task.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Created: {new Date(task.created_at).toLocaleDateString()}
                          </div>
                          {task.completed_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Completed: {new Date(task.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {task.lead && (
                          <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-white font-medium">Associated Lead</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-400">Name: </span>
                                <span className="text-white">{task.lead.name}</span>
                              </div>
                              {task.lead.company && (
                                <div className="flex items-center gap-1">
                                  <Building className="w-3 h-3 text-slate-400" />
                                  <span className="text-white">{task.lead.company}</span>
                                </div>
                              )}
                              {task.lead.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span className="text-white">{task.lead.email}</span>
                                </div>
                              )}
                              {task.lead.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span className="text-white">{task.lead.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'pending')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createTask}
      />
    </div>
  );
};

export default TasksFollowUps;
