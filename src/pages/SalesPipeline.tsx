import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { TrendingUp, DollarSign } from "lucide-react";

const SalesPipeline = () => {
  const { userRole } = useAuth();
  const { leads, loading } = useLeads();
  
  // Calculate real pipeline data from actual leads
  const pipelineData = useMemo(() => {
    const stages = [
      { name: "New", status: "New", color: "bg-blue-500" },
      { name: "Contacted", status: "Contacted", color: "bg-yellow-500" },
      { name: "Follow-Up", status: "Follow-Up", color: "bg-orange-500" },
      { name: "Converted", status: "Converted", color: "bg-green-500" },
    ];

    return stages.map(stage => {
      const stageLeads = leads.filter(lead => lead.status === stage.status);
      const stageValue = stageLeads
        .filter(lead => lead.value)
        .reduce((sum, lead) => sum + (lead.value || 0), 0);

      return {
        ...stage,
        count: stageLeads.length,
        value: `₹${stageValue >= 1000 ? `${(stageValue / 1000).toFixed(1)}k` : stageValue.toLocaleString('en-IN')}`
      };
    });
  }, [leads]);

  // Calculate conversion rates
  const conversionRates = useMemo(() => {
    const newLeads = leads.filter(lead => lead.status === 'New').length;
    const contactedLeads = leads.filter(lead => lead.status === 'Contacted').length;
    const followUpLeads = leads.filter(lead => lead.status === 'Follow-Up').length;
    const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;

    const newToContacted = newLeads > 0 ? Math.round((contactedLeads / (newLeads + contactedLeads)) * 100) : 0;
    const contactedToFollowUp = contactedLeads > 0 ? Math.round((followUpLeads / (contactedLeads + followUpLeads)) * 100) : 0;
    const followUpToConverted = followUpLeads > 0 ? Math.round((convertedLeads / (followUpLeads + convertedLeads)) * 100) : 0;

    return { newToContacted, contactedToFollowUp, followUpToConverted };
  }, [leads]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const totalValue = leads
      .filter(lead => lead.value)
      .reduce((sum, lead) => sum + (lead.value || 0), 0);
    
    const convertedLeads = leads.filter(lead => lead.status === 'Converted');
    const avgDealSize = convertedLeads.length > 0 
      ? Math.round(totalValue / convertedLeads.length)
      : 0;
    
    const closeRate = leads.length > 0 
      ? Math.round((convertedLeads.length / leads.length) * 100)
      : 0;

    return {
      totalValue: totalValue >= 1000 
        ? `₹${(totalValue / 1000).toFixed(1)}k` 
        : `₹${totalValue.toLocaleString('en-IN')}`,
      avgDealSize: avgDealSize >= 1000 
        ? `₹${(avgDealSize / 1000).toFixed(1)}k` 
        : `₹${avgDealSize.toLocaleString('en-IN')}`,
      closeRate
    };
  }, [leads]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sales Pipeline</h1>
            <p className="text-slate-400">Track your sales progress and conversion rates (Currency: Indian Rupees ₹)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {pipelineData.map((stage, index) => (
              <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">{stage.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">{stage.count}</p>
                  <p className="text-slate-400 text-sm">Leads</p>
                  <div className="flex items-center gap-1 text-green-400">
                    <span className="text-sm font-medium">{stage.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <h3 className="text-white font-medium mb-4">Pipeline Overview</h3>
            <div className="flex items-center gap-2 mb-4">
              {pipelineData.map((stage, index) => (
                <div key={index} className="flex-1">
                  <div className={`h-8 ${stage.color} rounded-lg flex items-center justify-center text-white text-sm font-medium`}>
                    {stage.count}
                  </div>
                  <p className="text-slate-400 text-xs text-center mt-1">{stage.name}</p>
                </div>
              ))}
            </div>
            {leads.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No leads in pipeline yet</p>
                <p className="text-slate-500 text-sm">Start by adding leads to see your sales pipeline data</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Conversion Rates</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">New → Contacted</span>
                  <span className="text-green-400 font-medium">{conversionRates.newToContacted}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Contacted → Follow-Up</span>
                  <span className="text-green-400 font-medium">{conversionRates.contactedToFollowUp}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Follow-Up → Converted</span>
                  <span className="text-green-400 font-medium">{conversionRates.followUpToConverted}%</span>
                </div>
              </div>
              {leads.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm">Add leads to see conversion rates</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Performance Metrics (INR)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Pipeline Value</span>
                  <span className="text-white font-medium">{performanceMetrics.totalValue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Average Deal Size</span>
                  <span className="text-white font-medium">{performanceMetrics.avgDealSize}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Close Rate</span>
                  <span className="text-green-400 font-medium">{performanceMetrics.closeRate}%</span>
                </div>
              </div>
              {leads.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm">Add leads with values to see metrics</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPipeline;
