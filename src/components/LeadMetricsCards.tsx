import { Users, Flame, Clock, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useEffect, useState, useRef } from "react";

export const LeadMetricsCards = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { leads } = useLeads(user, userRole);
  const [animateCount, setAnimateCount] = useState(false);
  const previousCountRef = useRef(0);

  // Trigger animation when leads count changes
  useEffect(() => {
    const currentCount = leads.length;
    const previousCount = previousCountRef.current;
    
    console.log('Leads count changed:', previousCount, '->', currentCount);
    
    // Only animate if count increased and we have a valid previous count
    if (currentCount > previousCount && previousCount > 0) {
      console.log('Triggering animation for lead count increase');
      setAnimateCount(true);
      const timer = setTimeout(() => {
        console.log('Stopping animation');
        setAnimateCount(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Always update the ref after checking
    previousCountRef.current = currentCount;
  }, [leads.length]); // Only depend on leads.length

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const hotLeads = leads.filter(lead => lead.status === 'Contacted' || lead.status === 'Follow-Up').length;
    const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
    
    // Calculate follow-ups due today (mock for now since we don't have tasks implemented)
    const followUpsToday = leads.filter(lead => lead.status === 'Follow-Up').length;
    
    // Calculate upcoming meetings (mock for now since we don't have calendar implemented)
    const upcomingMeetings = Math.floor(totalLeads * 0.1); // Rough estimate

    // Calculate total revenue in INR
    const totalRevenue = leads
      .filter(lead => lead.status === 'Converted' && lead.value)
      .reduce((sum, lead) => sum + (lead.value || 0), 0);

    const formatCurrency = (amount: number) => {
      if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}k`;
      }
      return `₹${amount.toLocaleString('en-IN')}`;
    };

    return [
      {
        title: "Total Leads",
        value: totalLeads.toString(),
        change: totalLeads === 0 ? "Start adding leads" : `+${Math.floor(totalLeads * 0.1)} this week`,
        icon: Users,
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        onClick: () => navigate("/leads"),
        animate: animateCount
      },
      {
        title: "Hot Leads",
        value: hotLeads.toString(),
        change: hotLeads === 0 ? "No hot leads yet" : `${Math.round((hotLeads/totalLeads) * 100)}% of total`,
        icon: Flame,
        color: "from-red-500 to-orange-600",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        onClick: () => navigate("/leads?status=Contacted")
      },
      {
        title: "Follow-Ups Today",
        value: followUpsToday.toString(),
        change: followUpsToday === 0 ? "No follow-ups scheduled" : "Need attention",
        icon: Clock,
        color: "from-yellow-500 to-orange-600",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        onClick: () => navigate("/tasks")
      },
      {
        title: "Revenue (INR)",
        value: formatCurrency(totalRevenue),
        change: convertedLeads === 0 ? "No conversions yet" : `${convertedLeads} conversions`,
        icon: TrendingUp,
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        onClick: () => navigate("/pipeline")
      },
      {
        title: "Upcoming Meetings",
        value: upcomingMeetings.toString(),
        change: upcomingMeetings === 0 ? "No meetings scheduled" : "This week",
        icon: Calendar,
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        onClick: () => navigate("/calendar")
      }
    ];
  }, [leads, navigate, animateCount]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          onClick={metric.onClick}
          className={`${metric.bgColor} ${metric.borderColor} border rounded-xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer group ${
            metric.animate ? 'animate-pulse scale-105' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color} transition-all duration-300 ${
              metric.animate ? 'scale-110 shadow-lg' : ''
            }`}>
              <metric.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">{metric.title}</p>
            <p className={`text-white text-2xl font-bold mb-1 transition-all duration-300 ${
              metric.animate ? 'scale-110 text-blue-400' : ''
            }`}>
              {metric.value}
            </p>
            <p className="text-slate-500 text-xs">{metric.change}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
