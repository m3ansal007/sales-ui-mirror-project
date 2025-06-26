import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddAppointmentModal = ({ isOpen, onClose, onSubmit }: AddAppointmentModalProps) => {
  const { leads } = useLeads();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    type: 'Meeting',
    location: '',
    lead_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({
        ...formData,
        status: 'Scheduled',
        lead_id: formData.lead_id || null
      });
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        type: 'Meeting',
        location: '',
        lead_id: ''
      });
      onClose();
    } catch (error) {
      console.error('Error submitting appointment:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Schedule Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-slate-300">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-slate-300">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="Meeting">Meeting</SelectItem>
                <SelectItem value="Demo">Demo</SelectItem>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="Presentation">Presentation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lead_id" className="text-slate-300">Related Lead (Optional)</Label>
            <Select value={formData.lead_id} onValueChange={(value) => setFormData({ ...formData, lead_id: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>{lead.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time" className="text-slate-300">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time" className="text-slate-300">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="text-slate-300">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="e.g., Conference Room A, Zoom, etc."
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Schedule Meeting
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
