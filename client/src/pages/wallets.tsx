import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateWalletModal from "@/components/modals/create-wallet-modal";
import { Progress } from "@/components/ui/progress";

const getWalletIcon = (type: string) => {
  switch (type) {
    case 'shared': return 'fas fa-home';
    case 'savings_goal': return 'fas fa-piggy-bank';
    case 'personal': 
    default: return 'fas fa-user';
  }
};

const getWalletIconColor = (type: string) => {
  switch (type) {
    case 'shared': return 'primary';
    case 'savings_goal': return 'blue';
    case 'personal': 
    default: return 'green';
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'owner': return 'bg-success-100 text-success-800';
    case 'manager': return 'bg-primary-100 text-primary-800';
    case 'contributor': return 'bg-blue-100 text-blue-800';
    case 'viewer': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Wallets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);

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

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading wallets...</p>
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
            <TopBar title="Wallets" subtitle="Manage your financial accounts and savings goals" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Wallets</h3>
                <p className="text-sm text-gray-500">
                  {wallets?.length || 0} wallet{(wallets?.length || 0) !== 1 ? 's' : ''} total
                </p>
              </div>
              <Button
                onClick={() => setIsCreateWalletOpen(true)}
                className="btn-primary"
              >
                <i className="fas fa-plus text-sm mr-2"></i>
                Create Wallet
              </Button>
            </div>

            {walletsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !wallets || wallets.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-wallet text-gray-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No wallets yet</h3>
                  <p className="text-gray-500 mb-4">Create your first wallet to start tracking expenses.</p>
                  <Button
                    onClick={() => setIsCreateWalletOpen(true)}
                    className="btn-primary"
                  >
                    <i className="fas fa-plus text-sm mr-2"></i>
                    Create Your First Wallet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets.map((wallet: any) => {
                  const icon = getWalletIcon(wallet.type);
                  const iconColor = getWalletIconColor(wallet.type);
                  const userRole = wallet.members?.find((m: any) => m.user)?.role || 'owner';
                  
                  return (
                    <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-${iconColor}-100 rounded-lg flex items-center justify-center`}>
                              <i className={`${icon} text-${iconColor}-600`}></i>
                            </div>
                            <div>
                              <CardTitle className="text-lg">{wallet.name}</CardTitle>
                              <p className="text-sm text-gray-500 capitalize">
                                {wallet.type.replace('_', ' ')} Wallet
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getRoleBadge(userRole)} capitalize`}>
                            {userRole}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="mb-4">
                          <p className="text-3xl font-bold text-gray-900">
                            ${parseFloat(wallet.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {wallet._count?.members || 0} member{(wallet._count?.members || 0) !== 1 ? 's' : ''} • {wallet._count?.transactions || 0} transaction{(wallet._count?.transactions || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {wallet.type === 'savings_goal' && wallet.goalAmount && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Goal Progress</span>
                              <span className="font-medium">
                                {Math.round((parseFloat(wallet.balance) / parseFloat(wallet.goalAmount)) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.min((parseFloat(wallet.balance) / parseFloat(wallet.goalAmount)) * 100, 100)} 
                              className="h-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Goal: ${parseFloat(wallet.goalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}

                        {wallet.description && (
                          <p className="text-sm text-gray-600 mb-4">{wallet.description}</p>
                        )}

                        <div className="flex space-x-2">
                          <Button variant="outline" className="flex-1" size="sm">
                            <i className="fas fa-eye text-xs mr-2"></i>
                            View Details
                          </Button>
                          {['owner', 'manager'].includes(userRole) && (
                            <Button variant="outline" className="flex-1" size="sm">
                              <i className="fas fa-cog text-xs mr-2"></i>
                              Manage
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateWalletModal
        isOpen={isCreateWalletOpen}
        onClose={() => setIsCreateWalletOpen(false)}
      />
    </>
  );
}
