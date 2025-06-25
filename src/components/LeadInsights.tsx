
import { Users, AlertTriangle, Clock, Flame } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useMemo } from "react";

export const LeadInsights = () => {
  const { leads } = useLeads();

  const insights = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Calculate new leads today (leads created today)
    const newLeadsToday = leads.filter(lead => {
      const createdDate = new Date(lead.created_at);
      return createdDate.toDateString() === today.toDateString();
    }).length;

    // Calculate new leads yesterday for comparison
    const newLeadsYesterday = leads.filter(lead => {
      const createdDate = new Date(lead.created_at);
      return createdDate.toDateString() === yesterday.toDateString();
    }).length;

    // Calculate unattended leads (New status)
    const unattendedLeads = leads.filter(lead => lead.status === 'New').length;

    // Calculate follow-ups (Follow-Up status)
    const followUpLeads = leads.filter(lead => lead.status === 'Follow-Up').length;

    // Calculate high-intent leads (Contacted status, ready to convert)
    const highIntentLeads = leads.filter(lead => lead.status === 'Contacted').length;

    return {
      newLeadsToday,
      newLeadsYesterday,
      unattendedLeads,
      followUpLeads,
      highIntentLeads,
      totalLeads: leads.length
    };
  }, [leads]);

  const aiAlerts = useMemo(() => {
    const alerts = [];

    // Alert for hot leads not contacted
    if (insights.unattendedLeads > 0) {
      alerts.push({
        type: 'danger',
        icon: AlertTriangle,
        message: `${insights.unattendedLeads} New leads need immediate attention`,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-300'
      });
    }

    // Alert for follow-ups
    if (insights.followUpLeads > 0) {
      alerts.push({
        type: 'warning',
        icon: '⚡',
        message: `${insights.followUpLeads} leads waiting for follow-up`,
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-300'
      });
    }

    // Positive alert for high-intent leads
    if (insights.highIntentLeads > 0) {
      alerts.push({
        type: 'success',
        icon: '✓',
        message: `${insights.highIntentLeads} contacted leads ready for conversion`,
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-300'
      });
    }

    // Default message if no alerts
    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        icon: '🤖',
        message: 'All leads are properly managed. Great job!',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-300'
      });
    }

    return alerts;
  }, [insights]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Today's Overview</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-sm">New Leads</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">
              {insights.newLeadsToday > insights.newLeadsYesterday 
                ? `+${insights.newLeadsToday - insights.newLeadsYesterday} since yesterday`
                : insights.newLeadsToday === insights.newLeadsYesterday
                ? 'Same as yesterday'
                : `${insights.newLeadsYesterday - insights.newLeadsToday} less than yesterday`
              }
            </p>
            <p className="text-white text-2xl font-bold">{insights.newLeadsToday}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-slate-400 text-sm">Unattended</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">
              {insights.unattendedLeads > 0 ? 'Needs attention' : 'All attended'}
            </p>
            <p className="text-white text-2xl font-bold">{insights.unattendedLeads}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400 text-sm">Follow-ups</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">
              {insights.followUpLeads > 0 ? 'Pending action' : 'All updated'}
            </p>
            <p className="text-white text-2xl font-bold">{insights.followUpLeads}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-slate-400 text-sm">High-Intent</span>
            </div>
            <p className="text-slate-400 text-xs mb-1">
              {insights.highIntentLeads > 0 ? 'Ready to convert' : 'Focus on nurturing'}
            </p>
            <p className="text-white text-2xl font-bold">{insights.highIntentLeads}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
            <span className="text-xs">🤖</span>
          </div>
          <h3 className="text-white font-medium">AI Insights & Alerts</h3>
        </div>
        
        <div className="space-y-3">
          {aiAlerts.map((alert, index) => (
            <div key={index} className={`${alert.bgColor} ${alert.borderColor} border rounded-lg p-3`}>
              <div className="flex items-center gap-2">
                {typeof alert.icon === 'string' ? (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <span className="text-xs">{alert.icon}</span>
                  </div>
                ) : (
                  <alert.icon className="w-4 h-4 text-current" />
                )}
                <span className={`${alert.textColor} text-sm`}>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
