import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Mail, Phone, Trash } from 'lucide-react';
import { AddLeadModal } from '@/components/AddLeadModal';
import { EditLeadModal } from '@/components/EditLeadModal';
import { useLeads } from '@/hooks/useLeads';
import { useSearchParams } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const AllLeads = () => {
  const { leads, loading, createLead, updateLead, deleteLead } = useLeads();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Handle URL parameters for status filtering
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['New', 'Contacted', 'Follow-Up', 'Converted', 'Lost'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const filteredLeads = statusFilter === 'All' 
    ? leads 
    : leads.filter(lead => lead.status === statusFilter);

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      await deleteLead(id);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select leads to delete",
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Delete leads one by one
      for (const leadId of selectedLeads) {
        try {
          const success = await deleteLead(leadId);
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Error deleting lead ${leadId}:`, error);
        }
      }

      // Clear selection
      setSelectedLeads([]);

      // Show result toast
      if (successCount > 0) {
        toast({
          title: "Leads deleted",
          description: `Successfully deleted ${successCount} lead${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed to delete.` : '.'}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Delete failed",
          description: `Failed to delete ${errorCount} lead${errorCount > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting leads",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500/20 text-blue-400';
      case 'Contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'Follow-Up': return 'bg-orange-500/20 text-orange-400';
      case 'Converted': return 'bg-green-500/20 text-green-400';
      case 'Lost': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const isAllSelected = filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length;
  const isSomeSelected = selectedLeads.length > 0 && selectedLeads.length < filteredLeads.length;

  // Update indeterminate state
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">All Leads</h1>
            <p className="text-slate-400">Manage and track all your sales leads</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              {['All', 'New', 'Contacted', 'Follow-Up', 'Converted', 'Lost'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-blue-600" : ""}
                >
                  {status}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {selectedLeads.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : `Delete ${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''}`}
                </Button>
              )}
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="add-lead-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading leads...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-300 w-12">
                      <Checkbox
                        ref={selectAllCheckboxRef}
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className="border-slate-600"
                      />
                    </TableHead>
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Company</TableHead>
                    <TableHead className="text-slate-300">Contact</TableHead>
                    <TableHead className="text-slate-300">Source</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Value</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                          className="border-slate-600"
                        />
                      </TableCell>
                      <TableCell className="text-white font-medium">{lead.name}</TableCell>
                      <TableCell className="text-slate-300">{lead.company || '-'}</TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="text-green-400 hover:text-green-300">
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          <span className="text-sm">{lead.email || lead.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{lead.source || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {lead.value ? `₹${lead.value.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLead(lead)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!loading && filteredLeads.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No leads found. {statusFilter !== 'All' && `Try changing the filter or `}
                <Button 
                  variant="link" 
                  onClick={() => setShowAddModal(true)}
                  className="text-blue-400 p-0 h-auto"
                >
                  add your first lead
                </Button>
              </div>
            )}
          </div>

          {selectedLeads.length > 0 && (
            <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLeads([])}
                    className="border-slate-600 text-slate-300"
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createLead}
      />

      <EditLeadModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        lead={selectedLead}
        onUpdate={updateLead}
      />
    </div>
  );
};

export default AllLeads;
