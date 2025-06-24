
import { Clock, Plus, Calendar, User } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const TasksFollowUps = () => {
  const tasks = [
    { id: 1, title: "Follow up with John Smith", lead: "John Smith", dueDate: "2024-01-15", priority: "High", type: "Follow-up" },
    { id: 2, title: "Send proposal to Emma Johnson", lead: "Emma Johnson", dueDate: "2024-01-16", priority: "Medium", type: "Task" },
    { id: 3, title: "Schedule demo for Mike Davis", lead: "Mike Davis", dueDate: "2024-01-17", priority: "High", type: "Meeting" },
    { id: 4, title: "Send contract to Lisa Brown", lead: "Lisa Brown", dueDate: "2024-01-18", priority: "Low", type: "Task" },
  ];

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
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">All Tasks</button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700">Due Today</button>
              <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700">Overdue</button>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-2">{task.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {task.lead}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {task.dueDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {task.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {task.priority}
                    </span>
                    <button className="text-blue-400 hover:text-blue-300 text-sm">Complete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksFollowUps;
