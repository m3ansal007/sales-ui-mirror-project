import React from 'react';
import { Users, TrendingUp, Clock, DollarSign, Target, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';

interface LeadMetricsCardsProps {
  leads?: any[];
}

export const LeadMetricsCards: React.FC<LeadMetricsCardsProps> = ({ leads: propLeads }) => {
  const { userRole } = useAuth();
  const { leads: hookLeads, loading } = useLeads();
  
  const leads = propLeads || hookLeads;

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter(lead => lead.status === 'New').length || 0;
  const contactedLeads = leads?.filter(lead => lead.status === 'Contacted').length || 0;
  const convertedLeads = leads?.filter(lead => lead.status === 'Converted').length || 0;
  const totalValue = leads?.reduce((sum, lead) => sum + (lead.value || 0), 0) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Leads */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 w-12 h-12 rounded-full bg-blue-500/20 text-blue-400">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-slate-400 text-sm">Total Leads</h4>
          <p className="text-white font-medium text-lg">{totalLeads}</p>
        </div>
      </div>

      {/* New Leads */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-400">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-slate-400 text-sm">New Leads</h4>
          <p className="text-white font-medium text-lg">{newLeads}</p>
        </div>
      </div>

      {/* Contacted Leads */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 w-12 h-12 rounded-full bg-orange-500/20 text-orange-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-slate-400 text-sm">Contacted Leads</h4>
          <p className="text-white font-medium text-lg">{contactedLeads}</p>
        </div>
      </div>

      {/* Converted Leads */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 w-12 h-12 rounded-full bg-green-500/20 text-green-400">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-slate-400 text-sm">Converted Leads</h4>
          <p className="text-white font-medium text-lg">{convertedLeads}</p>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-slate-400 text-sm">Total Value</h4>
          <p className="text-white font-medium text-lg">₹{totalValue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};
