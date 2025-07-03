
import { Sidebar } from "@/components/Sidebar";
import { LeadMetricsCards } from "@/components/LeadMetricsCards";
import { LeadActivityFeed } from "@/components/LeadActivityFeed";
import { LeadInsights } from "@/components/LeadInsights";
import { BottomBar } from "@/components/BottomBar";
import { ChatInterface } from "@/components/ChatInterface";
import { ChatProvider } from "@/contexts/ChatContext";
import { ColorProvider } from "@/contexts/ColorContext";
import { WelcomeHeader } from "@/components/WelcomeHeader";
import { QuickActions } from "@/components/QuickActions";

const DashboardContent = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <WelcomeHeader />
          <QuickActions />
          <LeadMetricsCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            <div className="lg:col-span-2 space-y-8">
              <LeadActivityFeed />
              <ChatInterface />
            </div>
            <div>
              <LeadInsights />
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
    <ColorProvider>
      <ChatProvider>
        <DashboardContent />
      </ChatProvider>
    </ColorProvider>
  );
};

export default Index;
