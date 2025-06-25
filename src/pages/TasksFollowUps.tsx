
import React, { useState } from 'react';
import { Clock, Plus, Calendar, User, CheckCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { AddTaskModal } from '@/components/AddTaskModal';
import { useTasks } from '@/hooks/useTasks';
import { useLeads } from '@/hooks/useLeads';

const TasksFollowUps = () => {
  const { tasks, loading, createTask, completeTask } = useTasks();
  const { leads } = useLeads();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('All Tasks');

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : 'Unknown Lead';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date().toDateString() !== new Date(dueDate).toDateString();
  };

  const isDueToday = (dueDate: string) => {
    return new Date().toDateString() === new Date(dueDate).toDateString();
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'Due Today':
        return task.due_date && isDueToday(task.due_date) && task.status !== 'Completed';
      case 'Overdue':
        return task.due_date && isOverdue(task.due_date) && task.status !== 'Completed';
      case 'Completed':
        return task.status === 'Completed';
      default:
        return true;
    }
  });

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'Low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTaskStatusColor = (task: any) => {
    if (task.status === 'Completed') return 'bg-green-500/20 text-green-400';
    if (task.due_date && isOverdue(task.due_date)) return 'bg-red-500/20 text-red-400';
    if (task.due_date && isDueToday(task.due_date)) return 'bg-orange-500/20 text-orange-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Tasks & Follow-Ups</h1>
            <p className="text-slate-400">Manage your pending tasks and follow-up activities</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              {['All Tasks', 'Due Today', 'Overdue', 'Completed'].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  onClick={() => setFilter(filterType)}
                  className={filter === filterType ? "bg-blue-600" : ""}
                >
                  {filterType}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No tasks found for this filter.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-2">{task.title}</h3>
                      {task.description && (
                        <p className="text-slate-400 text-sm mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {task.lead_id && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {getLeadName(task.lead_id)}
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {task.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task)}`}>
                        {task.status === 'Completed' ? 'Completed' :
                         task.due_date && isOverdue(task.due_date) ? 'Overdue' :
                         task.due_date && isDueToday(task.due_date) ? 'Due Today' : 'Pending'}
                      </span>
                      {task.status !== 'Completed' && (
                        <Button
                          onClick={() => handleCompleteTask(task.id)}
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
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
