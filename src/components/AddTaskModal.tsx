import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<boolean>;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { user, userRole } = useAuth();
  const { leads } = useLeads(user, userRole);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Task',
    priority: 'Medium',
    lead_id: '',
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      ...formData,
      lead_id: formData.lead_id || undefined,
      due_date: formData.due_date || undefined,
    };

    const success = await onSubmit(taskData);
    if (success) {
      setFormData({
        title: '',
        description: '',
        type: 'Task',
        priority: 'Medium',
        lead_id: '',
        due_date: '',
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-slate-300">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="text-slate-300">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority" className="text-slate-300">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead_id" className="text-slate-300">Associated Lead</Label>
              <Select value={formData.lead_id} onValueChange={(value) => setFormData({ ...formData, lead_id: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} {lead.company && `(${lead.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due_date" className="text-slate-300">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
