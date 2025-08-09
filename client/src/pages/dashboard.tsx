import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MobileNavigation from "@/components/layout/mobile-navigation";
import InstallPrompt from "@/components/ui/install-prompt";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import QuickActions from "@/components/dashboard/quick-actions";
import MobileQuickActions from "@/components/dashboard/mobile-quick-actions";
import MonthlyBudget from "@/components/dashboard/monthly-budget";
import WalletsOverview from "@/components/dashboard/wallets-overview";
import TeamManagement from "@/components/dashboard/team-management";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      <div className="min-h-screen flex bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto">
          {/* Desktop TopBar */}
          <div className="hidden md:block">
            <TopBar title="Dashboard" subtitle="Welcome back! Here's your financial overview." />
          </div>
          
          <div className="p-4 md:p-6 space-y-4 md:space-y-6 pt-20 md:pt-4 pb-24 md:pb-6">
            <StatsCards />
            
            {/* Mobile Quick Actions */}
            <MobileQuickActions />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2">
                <RecentTransactions />
              </div>
              <div className="space-y-4 md:space-y-6">
                {/* Desktop Quick Actions */}
                <div className="hidden md:block">
                  <QuickActions />
                </div>
                <MonthlyBudget />
              </div>
            </div>

            <WalletsOverview />
            <div className="hidden md:block">
              <TeamManagement />
            </div>
          </div>
        </main>
      </div>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </>
  );
}
