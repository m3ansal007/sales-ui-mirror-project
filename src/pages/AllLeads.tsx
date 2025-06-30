import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AssignedLeadsSection } from '@/components/AssignedLeadsSection';

const AllLeads = () => {
  const { leads, assignedLeads, loading, createLead, updateLead, deleteLead, refetch } = useLeads();
  const { user, userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('New');
  const [notes, setNotes] = useState('');
  const [value, setValue] = useState<number | undefined>(undefined);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCreateLead = async () => {
    const success = await createLead({
      name,
      email,
      phone,
      company,
      source,
      status,
      notes,
      value,
    });

    if (success) {
      setOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSource('');
      setStatus('New');
      setNotes('');
      setValue(undefined);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setEditOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!leadToEdit) return;

    const success = await updateLead(leadToEdit.id, {
      name,
      email,
      phone,
      company,
      source,
      status,
      notes,
      value,
    });

    if (success) {
      setEditOpen(false);
      setLeadToEdit(null);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSource('');
      setStatus('New');
      setNotes('');
      setValue(undefined);
    }
  };

  const handleDeleteLead = async (id: string) => {
    const success = await deleteLead(id);
    if (success) {
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    }
  };

  useEffect(() => {
    if (leadToEdit) {
      setName(leadToEdit.name);
      setEmail(leadToEdit.email || '');
      setPhone(leadToEdit.phone || '');
      setCompany(leadToEdit.company || '');
      setSource(leadToEdit.source || '');
      setStatus(leadToEdit.status);
      setNotes(leadToEdit.notes || '');
      setValue(leadToEdit.value);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSource('');
      setStatus('New');
      setNotes('');
      setValue(undefined);
    }
  }, [leadToEdit]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">All Leads</h1>
            <p className="text-slate-400">Manage and track your leads</p>
          </div>

          {/* Show assigned leads section for Sales Associates */}
          {userRole === 'Sales Associate' && (
            <div className="mb-8">
              <AssignedLeadsSection
                assignedLeads={assignedLeads}
                onEditLead={handleEditLead}
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Your Leads</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Lead</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Create a new lead to track.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-slate-300">
                      Name
                    </Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right text-slate-300">
                      Email
                    </Label>
                    <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right text-slate-300">
                      Phone
                    </Label>
                    <Input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right text-slate-300">
                      Company
                    </Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="source" className="text-right text-slate-300">
                      Source
                    </Label>
                    <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right text-slate-300">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="col-span-3 bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="New" className="text-white">New</SelectItem>
                        <SelectItem value="Contacted" className="text-white">Contacted</SelectItem>
                        <SelectItem value="Follow-Up" className="text-white">Follow-Up</SelectItem>
                        <SelectItem value="Converted" className="text-white">Converted</SelectItem>
                        <SelectItem value="Lost" className="text-white">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right text-slate-300">
                      Notes
                    </Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white resize-none" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="value" className="text-right text-slate-300">
                      Value
                    </Label>
                    <Input
                      type="number"
                      id="value"
                      value={value !== undefined ? value.toString() : ''}
                      onChange={(e) => {
                        const parsedValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        setValue(parsedValue);
                      }}
                      className="col-span-3 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateLead} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Create Lead
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center text-slate-400">Loading leads...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leads.map((lead) => (
                <div key={lead.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{lead.name}</h3>
                  <p className="text-slate-400 mb-2">Company: {lead.company || 'N/A'}</p>
                  <p className="text-slate-400 mb-2">Email: {lead.email || 'N/A'}</p>
                  <p className="text-slate-400 mb-2">Phone: {lead.phone || 'N/A'}</p>
                  <p className="text-slate-400 mb-2">Source: {lead.source || 'N/A'}</p>
                  <p className="text-slate-400 mb-2">Status: {lead.status}</p>
                  <p className="text-slate-400 mb-2">Value: {lead.value ? lead.value : 'N/A'}</p>
                  <p className="text-slate-400 mb-2">Notes: {lead.notes || 'N/A'}</p>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditLead(lead)} className="border-slate-600 text-slate-300">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteLead(lead.id)} className="bg-red-600 hover:bg-red-700 text-white">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Lead</DialogTitle>
            <DialogDescription className="text-slate-400">
              Edit the details of this lead.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-slate-300">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-slate-300">
                Email
              </Label>
              <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right text-slate-300">
                Phone
              </Label>
              <Input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right text-slate-300">
                Company
              </Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="source" className="text-right text-slate-300">
                Source
              </Label>
              <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right text-slate-300">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="New" className="text-white">New</SelectItem>
                  <SelectItem value="Contacted" className="text-white">Contacted</SelectItem>
                  <SelectItem value="Follow-Up" className="text-white">Follow-Up</SelectItem>
                  <SelectItem value="Converted" className="text-white">Converted</SelectItem>
                  <SelectItem value="Lost" className="text-white">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right text-slate-300">
                Notes
              </Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3 bg-slate-800 border-slate-700 text-white resize-none" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right text-slate-300">
                Value
              </Label>
              <Input
                type="number"
                id="value"
                value={value !== undefined ? value.toString() : ''}
                onChange={(e) => {
                  const parsedValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setValue(parsedValue);
                }}
                className="col-span-3 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateLead} className="bg-blue-600 hover:bg-blue-700 text-white">
              Update Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllLeads;
