import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead } from '@/hooks/useLeads';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<boolean>;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    status: 'New',
    notes: '',
    value: '',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source || '',
        status: lead.status || 'New',
        notes: lead.notes || '',
        value: lead.value?.toString() || '',
      });
      setValidationErrors([]);
    }
  }, [lead]);

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.push('Please enter a valid email address');
      }
    }
    
    // Removed strict phone validation - now accepts any non-empty string
    if (formData.phone && formData.phone.trim()) {
      // Just check that it's not empty after trimming
      if (formData.phone.trim().length === 0) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    if (!formData.email?.trim() && !formData.phone?.trim()) {
      errors.push('Either email or phone number is required');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    if (!validateForm()) {
      return;
    }

    const updates = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      company: formData.company.trim() || undefined,
      source: formData.source || undefined,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
      value: formData.value ? parseFloat(formData.value) : undefined,
    };

    const success = await onUpdate(lead.id, updates);
    if (success) {
      onClose();
      setValidationErrors([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Lead</DialogTitle>
        </DialogHeader>
        
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <ul className="text-red-400 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-slate-300">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Any format accepted"
              />
              <p className="text-xs text-slate-500 mt-1">
                Accepts any format: +1-555-123-4567, (555) 123-4567, 555.123.4567, etc.
              </p>
            </div>
            <div>
              <Label htmlFor="company" className="text-slate-300">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="source" className="text-slate-300">Source</Label>
              <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status" className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="value" className="text-slate-300">Value ($)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Update Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};