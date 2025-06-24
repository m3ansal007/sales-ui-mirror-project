
import { Target, Users, TrendingUp, Calendar } from "lucide-react";

export const MetricsCards = () => {
  const metrics = [
    {
      title: "Active Deals",
      value: "24",
      icon: Target,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30"
    },
    {
      title: "Team Members",
      value: "12",
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30"
    },
    {
      title: "Closed Deals",
      value: "89",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30"
    },
    {
      title: "Upcoming Deadlines",
      value: "7",
      icon: Calendar,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`${metric.bgColor} ${metric.borderColor} border rounded-xl p-6 transition-all duration-200 hover:scale-105`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
              <metric.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">{metric.title}</p>
            <p className="text-white text-3xl font-bold">{metric.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
