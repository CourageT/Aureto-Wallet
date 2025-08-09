import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreateWalletModal from "@/components/modals/create-wallet-modal";

const getWalletIcon = (type: string) => {
  switch (type) {
    case 'shared': return 'fas fa-home';
    case 'savings_goal': return 'fas fa-plane';
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
    case 'owner': return 'badge-success';
    case 'manager': return 'badge-primary';
    case 'contributor': return 'badge-secondary';
    case 'viewer': return 'badge-secondary';
    default: return 'badge-secondary';
  }
};

export default function WalletsOverview() {
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
  
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["/api/wallets"],
  });

  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Wallets Overview</CardTitle>
            <Button
              onClick={() => setIsCreateWalletOpen(true)}
              className="btn-primary px-4 py-2"
            >
              <i className="fas fa-plus text-sm mr-2"></i>
              New Wallet
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="wallet-card animate-pulse">
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : !Array.isArray(wallets) || wallets.length === 0 ? (
            <div className="text-center py-12">
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
                Create Wallet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(wallets) ? wallets.map((wallet: any) => {
                const icon = getWalletIcon(wallet.type);
                const iconColor = getWalletIconColor(wallet.type);
                const userRole = wallet.members?.find((m: any) => m.user)?.role || 'owner';
                
                return (
                  <div key={wallet.id} className="wallet-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-${iconColor}-100 rounded-lg flex items-center justify-center`}>
                          <i className={`${icon} text-${iconColor}-600`}></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">
                            {wallet.type.replace('_', ' ')} Wallet
                          </p>
                        </div>
                      </div>
                      <span className={`${getRoleBadge(userRole)} capitalize`}>
                        {userRole}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-gray-900">
                        ${parseFloat(wallet.balance || '0').toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {wallet._count?.members || 0} member{(wallet._count?.members || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {wallet.type === 'savings_goal' && wallet.goalAmount && (
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min((parseFloat(wallet.balance) / parseFloat(wallet.goalAmount)) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Goal: ${parseFloat(wallet.goalAmount).toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button variant="ghost" className="flex-1 btn-secondary text-sm">
                        View
                      </Button>
                      <Button variant="ghost" className="flex-1 bg-primary-100 text-primary-700 hover:bg-primary-200 text-sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                );
              }) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateWalletModal
        isOpen={isCreateWalletOpen}
        onClose={() => setIsCreateWalletOpen(false)}
      />
    </>
  );
}
