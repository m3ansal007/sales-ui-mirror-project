
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTeamMemberModal = ({ isOpen, onClose }: AddTeamMemberModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Sales Associate',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addTeamMember } = useTeamMembers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create team member record with the provided password in temp_password column
      // The database trigger will automatically create a user account using this password
      await addTeamMember({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        temp_password: formData.password, // Pass password to trigger
      });

      setShowSuccess(true);
      toast.success('Team member and login account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'Sales Associate',
      status: 'Active'
    });
    setShowSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        
        {showSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <h3 className="text-green-400 font-medium mb-2">Account Created Successfully!</h3>
              <p className="text-sm text-slate-300 mb-3">
                {formData.name} has been added to your team and can now login with these credentials.
              </p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-slate-400">Email:</Label>
                  <p className="text-white font-mono text-sm">{formData.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Password:</Label>
                  <p className="text-white font-mono text-sm">{formData.password}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Role:</Label>
                  <p className="text-white text-sm">{formData.role}</p>
                </div>
              </div>
              <p className="text-xs text-green-400 mt-3">
                ✅ Team member can now login immediately with these credentials.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter login password"
                required
                minLength={6}
              />
              <p className="text-xs text-slate-400 mt-1">Minimum 6 characters - this will be their login password</p>
            </div>

            <div>
              <Label htmlFor="phone" className="text-slate-300">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-slate-300">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Sales Manager">
                    📊 Sales Manager
                  </SelectItem>
                  <SelectItem value="Sales Associate">
                    💼 Sales Associate
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                {formData.role === 'Sales Manager' && 'Can manage team members and view all leads'}
                {formData.role === 'Sales Associate' && 'Can manage their own leads and tasks'}
              </p>
            </div>

            <div>
              <Label htmlFor="status" className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Away">Away</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Adding...' : 'Add Team Member'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
