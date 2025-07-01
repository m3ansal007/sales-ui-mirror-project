import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { user, userRole } = useAuth();
  const { leads, loading } = useLeads();
  const [leadSourceData, setLeadSourceData] = useState([]);
  const [leadStatusData, setLeadStatusData] = useState([]);

  useEffect(() => {
    if (leads && leads.length > 0) {
      // Prepare lead source data
      const sourceCounts = leads.reduce((acc, lead) => {
        acc[lead.source || 'Unknown'] = (acc[lead.source || 'Unknown'] || 0) + 1;
        return acc;
      }, {});
      const sourceData = Object.keys(sourceCounts).map(source => ({
        name: source,
        count: sourceCounts[source],
      }));
      setLeadSourceData(sourceData);

      // Prepare lead status data
      const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});
      const statusData = Object.keys(statusCounts).map(status => ({
        name: status,
        count: statusCounts[status],
      }));
      setLeadStatusData(statusData);
    }
  }, [leads]);
  
  const getLeadsByAssignee = () => {
    return leads.reduce((acc, lead) => {
      const assignee = lead.assigned_team_member_id || 'Unassigned';
      if (!acc[assignee]) {
        acc[assignee] = [];
      }
      acc[assignee].push(lead);
      return acc;
    }, {} as Record<string, typeof leads>);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-4">Reports</h1>
          <p className="text-slate-400 mb-8">Overview of lead sources and statuses.</p>

          {loading ? (
            <div className="text-center text-slate-400">Loading reports...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lead Source Report */}
                <div className="bg-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Lead Sources</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={leadSourceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" stroke="#CBD5E0" />
                      <YAxis stroke="#CBD5E0" />
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none' }} itemStyle={{ color: '#CBD5E0' }} />
                      <Legend wrapperStyle={{ color: '#CBD5E0' }} />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Lead Status Report */}
                <div className="bg-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Lead Statuses</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={leadStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" stroke="#CBD5E0" />
                      <YAxis stroke="#CBD5E0" />
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none' }} itemStyle={{ color: '#CBD5E0' }} />
                      <Legend wrapperStyle={{ color: '#CBD5E0' }} />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
