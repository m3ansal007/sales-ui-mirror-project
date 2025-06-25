
import { Users, Flame, Clock, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LeadMetricsCards = () => {
  const navigate = useNavigate();

  const metrics = [
    {
      title: "Total Leads",
      value: "0",
      change: "Start adding leads",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      onClick: () => navigate("/leads")
    },
    {
      title: "Hot Leads",
      value: "0",
      change: "No hot leads yet",
      icon: Flame,
      color: "from-red-500 to-orange-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      onClick: () => navigate("/leads")
    },
    {
      title: "Follow-Ups Today",
      value: "0",
      change: "No follow-ups scheduled",
      icon: Clock,
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      onClick: () => navigate("/tasks")
    },
    {
      title: "Converted Leads",
      value: "0",
      change: "No conversions yet",
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      onClick: () => navigate("/pipeline")
    },
    {
      title: "Upcoming Meetings",
      value: "0",
      change: "No meetings scheduled",
      icon: Calendar,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      onClick: () => navigate("/calendar")
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          onClick={metric.onClick}
          className={`${metric.bgColor} ${metric.borderColor} border rounded-xl p-6 transition-all duration-200 hover:scale-105 cursor-pointer group`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
              <metric.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">{metric.title}</p>
            <p className="text-white text-2xl font-bold mb-1">{metric.value}</p>
            <p className="text-slate-500 text-xs">{metric.change}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
