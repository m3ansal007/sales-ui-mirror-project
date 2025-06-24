
import { Sidebar } from "@/components/Sidebar";
import { MetricsCards } from "@/components/MetricsCards";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DailyInsights } from "@/components/DailyInsights";
import { BottomBar } from "@/components/BottomBar";
import { ChatInterface } from "@/components/ChatInterface";
import { ApiKeySetup } from "@/components/ApiKeySetup";
import { ChatProvider, useChat } from "@/contexts/ChatContext";

const DashboardContent = () => {
  const { apiKey } = useChat();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Welcome back! Here's an overview of your sales workspace</p>
          </div>

          {!apiKey && (
            <div className="mb-8">
              <ApiKeySetup />
            </div>
          )}

          <MetricsCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            <div className="lg:col-span-2 space-y-8">
              <ActivityFeed />
              {apiKey && <ChatInterface />}
            </div>
            <div>
              <DailyInsights />
            </div>
          </div>
        </div>
      </div>

      <BottomBar />
    </div>
  );
};

const Index = () => {
  return (
    <ChatProvider>
      <DashboardContent />
    </ChatProvider>
  );
};

export default Index;
