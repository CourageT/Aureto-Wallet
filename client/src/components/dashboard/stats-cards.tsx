import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards() {
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["/api/wallets"],
  });
  
  // Get transactions for current month calculations
  const { data: monthlyData } = useQuery({
    queryKey: ["/api/reports/financial-summary"],
    enabled: Array.isArray(wallets) && wallets.length > 0,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalBalance = Array.isArray(wallets) ? wallets.reduce((sum: number, wallet: any) => sum + parseFloat(wallet.balance || '0'), 0) : 0;
  const activeWallets = Array.isArray(wallets) ? wallets.length : 0;
  const monthlyExpenses = monthlyData?.totalExpenses || 0;
  const monthlyIncome = monthlyData?.totalIncome || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-success-600 mt-1">
              <i className="fas fa-arrow-up text-xs"></i>
              <span>Across all wallets</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
            <i className="fas fa-wallet text-primary-500 text-lg"></i>
          </div>
        </div>
      </Card>
      
      <Card className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
            <p className="text-2xl font-bold text-gray-900">
              ${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span>This month</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
            <i className="fas fa-credit-card text-red-500 text-lg"></i>
          </div>
        </div>
      </Card>
      
      <Card className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Monthly Income</p>
            <p className="text-2xl font-bold text-gray-900">
              ${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-green-600 mt-1">
              <span>This month</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <i className="fas fa-arrow-down text-green-600 text-lg"></i>
          </div>
        </div>
      </Card>
      
      <Card className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Wallets</p>
            <p className="text-2xl font-bold text-gray-900">{activeWallets}</p>
            <p className="text-sm text-gray-600 mt-1">
              <span>Total wallets</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
            <i className="fas fa-layer-group text-warning-500 text-lg"></i>
          </div>
        </div>
      </Card>
    </div>
  );
}
