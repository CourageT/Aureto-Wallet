import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

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

  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: isAuthenticated,
  });

  // Set default wallet when wallets load
  useEffect(() => {
    if (wallets?.length && !selectedWallet) {
      setSelectedWallet(wallets[0].id);
    }
  }, [wallets, selectedWallet]);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));
  const endDate = new Date();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/wallets", selectedWallet, "summary", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(
        `/api/wallets/${selectedWallet}/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    },
    enabled: isAuthenticated && !!selectedWallet,
  });

  const { data: categorySpending, isLoading: categoryLoading } = useQuery({
    queryKey: ["/api/wallets", selectedWallet, "category-spending", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(
        `/api/wallets/${selectedWallet}/category-spending?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch category spending');
      return response.json();
    },
    enabled: isAuthenticated && !!selectedWallet,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedWalletName = wallets?.find((w: any) => w.id === selectedWallet)?.name || 'Wallet';

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
            <TopBar title="Reports" subtitle="Analyze your spending patterns and financial health" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
                  <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets?.map((wallet: any) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 3 months</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button className="btn-primary w-full">
                    <i className="fas fa-download text-sm mr-2"></i>
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!selectedWallet ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-pie text-gray-400 text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a wallet</h3>
                <p className="text-gray-500">Choose a wallet to view its financial reports and analytics.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        {summaryLoading ? (
                          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                          `$${summary?.totalIncome?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Last {selectedPeriod} days</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <i className="fas fa-arrow-up text-green-600 text-lg"></i>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {summaryLoading ? (
                          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                          `$${summary?.totalExpenses?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Last {selectedPeriod} days</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                      <i className="fas fa-arrow-down text-red-600 text-lg"></i>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Balance</p>
                      <p className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summaryLoading ? (
                          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                          `${(summary?.balance || 0) >= 0 ? '+' : ''}$${summary?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Income - Expenses</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                      <i className="fas fa-balance-scale text-primary-600 text-lg"></i>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summaryLoading ? (
                          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                          summary?.transactionCount || 0
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Total count</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <i className="fas fa-list text-blue-600 text-lg"></i>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Category Spending */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : !categorySpending || categorySpending.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-chart-pie text-gray-400 text-xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses in this period</h3>
                      <p className="text-gray-500">
                        No expense transactions found for {selectedWalletName} in the last {selectedPeriod} days.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categorySpending.map((category: any, index: number) => {
                        const totalExpenses = summary?.totalExpenses || 1;
                        const percentage = (category.totalAmount / totalExpenses) * 100;
                        
                        return (
                          <div key={category.categoryId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <i className="fas fa-tag text-primary-600"></i>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-medium text-gray-900">{category.categoryName}</p>
                                  <p className="font-semibold text-gray-900">
                                    ${category.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                                    <div
                                      className="bg-primary-500 h-2 rounded-full"
                                      style={{ width: `${Math.min(percentage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-500 whitespace-nowrap">
                                    {percentage.toFixed(1)}% • {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spending Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summaryLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-4 bg-gray-200 animate-pulse rounded"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Daily Average Spending</span>
                          <span className="font-medium">
                            ${((summary?.totalExpenses || 0) / parseInt(selectedPeriod)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Savings Rate</span>
                          <span className={`font-medium ${(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {summary?.totalIncome ? (((summary.balance || 0) / summary.totalIncome) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Top Category</span>
                          <span className="font-medium">
                            {categorySpending?.[0]?.categoryName || 'None'}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summaryLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-4 bg-gray-200 animate-pulse rounded"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            (summary?.balance || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <i className={`fas fa-heart text-2xl ${
                              (summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}></i>
                          </div>
                          <h3 className="text-lg font-semibold">
                            {(summary?.balance || 0) >= 0 ? 'Healthy' : 'Needs Attention'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {(summary?.balance || 0) >= 0 
                              ? 'You are spending within your means!'
                              : 'Consider reducing expenses or increasing income.'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          </div>
        </main>
      </div>
    </>
  );
}
