import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddTeamMemberModal = ({ open, onOpenChange, onSuccess }: AddTeamMemberModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Representative',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create team member record - trigger will automatically create user account
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: formData.status,
          user_id: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Get the generated password from the trigger
      const { data: authUser, error: authError } = await supabase
        .from('auth.users')
        .select('raw_user_meta_data')
        .eq('email', formData.email)
        .single();

      const tempPassword = authUser?.raw_user_meta_data?.temp_password || 'Generated automatically';

      setGeneratedCredentials({
        email: formData.email,
        password: tempPassword
      });

      toast({
        title: "Success",
        description: "Team member and login account created successfully! Please save the credentials shown below.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Sales Representative',
      status: 'Active'
    });
    setGeneratedCredentials(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        
        {generatedCredentials ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <h3 className="text-green-400 font-medium mb-2">Account Created Successfully!</h3>
              <p className="text-sm text-slate-300 mb-3">Login credentials:</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-slate-400">Email:</Label>
                  <p className="text-white font-mono text-sm">{generatedCredentials.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Password:</Label>
                  <p className="text-white font-mono text-sm">{generatedCredentials.password}</p>
                </div>
              </div>
              <p className="text-xs text-yellow-400 mt-3">⚠️ Please save these credentials - they won't be shown again!</p>
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
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                  <SelectItem value="Sales Associate">Sales Associate</SelectItem>
                </SelectContent>
              </Select>
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
                onClick={() => onOpenChange(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating...' : 'Create Account & Add Member'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberModal;
