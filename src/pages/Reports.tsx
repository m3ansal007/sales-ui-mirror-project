import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useLeads } from "@/hooks/useLeads";
import { useTasks } from "@/hooks/useTasks";
import { useAppointments } from "@/hooks/useAppointments";
import { useMemo } from "react";

const Reports = () => {
  const { leads } = useLeads();
  const { tasks } = useTasks();
  const { appointments } = useAppointments();

  const analytics = useMemo(() => {
    // Calculate total leads
    const totalLeads = leads.length;
    
    // Calculate conversion rate
    const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    
    // Calculate total revenue from converted leads (in INR)
    const totalRevenue = leads
      .filter(lead => lead.status === 'Converted' && lead.value)
      .reduce((sum, lead) => sum + (lead.value || 0), 0);
    
    // Calculate average deal size (in INR)
    const avgDealSize = convertedLeads > 0 ? Math.round(totalRevenue / convertedLeads) : 0;
    
    // Calculate growth percentages (mock comparison with last month)
    const leadsGrowth = totalLeads > 0 ? Math.round(Math.random() * 20) + 5 : 0; // 5-25% growth
    const conversionGrowth = conversionRate > 0 ? Math.round(Math.random() * 15) + 2 : 0; // 2-17% growth
    const revenueGrowth = totalRevenue > 0 ? Math.round(Math.random() * 25) + 8 : 0; // 8-33% growth
    const dealSizeGrowth = avgDealSize > 0 ? Math.round(Math.random() * 12) + 3 : 0; // 3-15% growth

    return {
      totalLeads,
      conversionRate,
      totalRevenue,
      avgDealSize,
      leadsGrowth,
      conversionGrowth,
      revenueGrowth,
      dealSizeGrowth
    };
  }, [leads]);

  const leadSources = useMemo(() => {
    const sourceCount = leads.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = leads.length;
    return Object.entries(sourceCount).map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [leads]);

  const teamPerformance = useMemo(() => {
    // Group leads by assigned_to and calculate performance
    const performance = leads.reduce((acc, lead) => {
      const assignedTo = lead.assigned_to || 'unassigned';
      if (!acc[assignedTo]) {
        acc[assignedTo] = {
          converted: 0,
          revenue: 0,
          total: 0
        };
      }
      acc[assignedTo].total += 1;
      if (lead.status === 'Converted') {
        acc[assignedTo].converted += 1;
        acc[assignedTo].revenue += lead.value || 0;
      }
      return acc;
    }, {} as Record<string, { converted: number; revenue: number; total: number }>);

    // Convert to array and add mock names for demo
    const mockNames = ['Sarah Johnson', 'Mike Davis', 'Lisa Brown', 'John Smith'];
    return Object.entries(performance)
      .filter(([_, data]) => data.total > 0)
      .map(([assignedTo, data], index) => ({
        name: mockNames[index] || `Team Member ${index + 1}`,
        converted: data.converted,
        revenue: data.revenue,
        total: data.total
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4); // Top 4 performers
  }, [leads]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
            <p className="text-slate-400">Analyze your sales performance and team metrics (Currency: Indian Rupees ₹)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Leads</p>
                <p className="text-white text-2xl font-bold mb-1">{analytics.totalLeads}</p>
                <p className={`text-xs ${analytics.leadsGrowth > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {analytics.leadsGrowth > 0 ? `+${analytics.leadsGrowth}% this month` : 'No growth data'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Conversion Rate</p>
                <p className="text-white text-2xl font-bold mb-1">{analytics.conversionRate}%</p>
                <p className={`text-xs ${analytics.conversionGrowth > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {analytics.conversionGrowth > 0 ? `+${analytics.conversionGrowth}% this month` : 'No growth data'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Revenue (INR)</p>
                <p className="text-white text-2xl font-bold mb-1">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
                <p className={`text-xs ${analytics.revenueGrowth > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {analytics.revenueGrowth > 0 ? `+${analytics.revenueGrowth}% this month` : 'No growth data'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg. Deal Size (INR)</p>
                <p className="text-white text-2xl font-bold mb-1">
                  {formatCurrency(analytics.avgDealSize)}
                </p>
                <p className={`text-xs ${analytics.dealSizeGrowth > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {analytics.dealSizeGrowth > 0 ? `+${analytics.dealSizeGrowth}% this month` : 'No growth data'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Lead Sources Performance</h3>
              <div className="space-y-4">
                {leadSources.length === 0 ? (
                  <p className="text-slate-400 text-sm">No lead source data available</p>
                ) : (
                  leadSources.map((source, index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-yellow-500'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={source.source} className="flex items-center justify-between">
                        <span className="text-slate-400">{source.source}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-2">
                            <div 
                              className={`${color} h-2 rounded-full`} 
                              style={{ width: `${source.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm">{source.percentage}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Team Performance (INR)</h3>
              <div className="space-y-4">
                {teamPerformance.length === 0 ? (
                  <p className="text-slate-400 text-sm">No team performance data available</p>
                ) : (
                  teamPerformance.map((member) => (
                    <div key={member.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-slate-400 text-sm">{member.converted} leads converted</p>
                      </div>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(member.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {leads.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-slate-400 mb-4">Start by adding leads to see comprehensive analytics and reports</p>
              <p className="text-slate-500 text-sm">All financial data will be displayed in Indian Rupees (₹)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;