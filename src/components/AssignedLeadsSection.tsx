
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building, DollarSign, Calendar, Edit } from 'lucide-react';
import { Lead } from '@/hooks/useLeads';

interface AssignedLeadsSectionProps {
  assignedLeads: Lead[];
  onEditLead: (lead: Lead) => void;
}

export const AssignedLeadsSection: React.FC<AssignedLeadsSectionProps> = ({
  assignedLeads,
  onEditLead
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Contacted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Follow-Up': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Converted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatValue = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (assignedLeads.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Assigned Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No leads have been assigned to you yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          Assigned Leads ({assignedLeads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignedLeads.map((lead) => (
            <Card key={lead.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white text-lg">{lead.name}</h3>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {lead.company && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Building className="w-4 h-4" />
                      <span className="text-sm">{lead.company}</span>
                    </div>
                  )}
                  
                  {lead.email && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{lead.email}</span>
                    </div>
                  )}
                  
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{lead.phone}</span>
                    </div>
                  )}
                  
                  {lead.value && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">{formatValue(lead.value)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Assigned: {formatDate(lead.created_at)}</span>
                  </div>
                </div>

                {lead.notes && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400 line-clamp-2">{lead.notes}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    onClick={() => onEditLead(lead)}
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Lead
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
