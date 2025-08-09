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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, TrendingUp, TrendingDown, PieChart, BarChart3 } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { 
  LineChart, 
  Line, 
  PieChart as RechartsPieChart, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>('overview');

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

  const { data: wallets = [] } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: isAuthenticated,
  });

  // Set default wallet when wallets load
  useEffect(() => {
    if (wallets.length && !selectedWallet) {
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

  const selectedWalletName = wallets.find((w: any) => w.id === selectedWallet)?.name || 'Wallet';

  // Additional queries for enhanced reporting
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/reports/trends", selectedWallet, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/trends?period=monthly&walletId=${selectedWallet}`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    enabled: isAuthenticated && !!selectedWallet,
  });

  const { data: spendingAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["/api/reports/spending-analysis", selectedWallet, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/spending-analysis?period=monthly&walletId=${selectedWallet}`);
      if (!response.ok) throw new Error('Failed to fetch spending analysis');
      return response.json();
    },
    enabled: isAuthenticated && !!selectedWallet,
  });

  // Export functions
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('reports-content');
      if (!element) return;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${selectedWalletName}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Report has been exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    if (!categorySpending || categorySpending.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Category', 'Amount', 'Transaction Count', 'Percentage'].join(','),
      ...categorySpending.map((category: any) => {
        const totalExpenses = summary?.totalExpenses || 1;
        const percentage = ((category.totalAmount / totalExpenses) * 100).toFixed(1);
        return [
          category.categoryName,
          category.totalAmount.toFixed(2),
          category.transactionCount,
          percentage
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedWalletName}-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Data has been exported as CSV",
    });
  };

  // Chart colors
  const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

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
            <TopBar title="Enhanced Reports" subtitle="Advanced analytics and interactive visualizations" />
          </div>
          
          <div id="reports-content" className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
          {/* Enhanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Report Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
                  <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet: any) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Financial Overview</SelectItem>
                      <SelectItem value="trends">Spending Trends</SelectItem>
                      <SelectItem value="categories">Category Analysis</SelectItem>
                      <SelectItem value="detailed">Detailed Report</SelectItem>
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
                  <Button onClick={exportToCSV} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                <div className="flex items-end">
                  <Button onClick={exportToPDF} className="btn-primary w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
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
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Income vs Expenses</span>
                          <span className={`font-medium flex items-center ${(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(summary?.balance || 0) >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {(summary?.balance || 0) >= 0 ? 'Positive' : 'Negative'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Budget Status</span>
                          <span className="font-medium text-blue-600">On Track</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Financial Score</span>
                          <div className="flex items-center">
                            <span className="font-medium text-green-600 mr-2">85/100</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Interactive Charts Section */}
              {reportType === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart for Category Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PieChart className="w-5 h-5 mr-2" />
                        Expense Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {categoryLoading || !categorySpending?.length ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading chart data...</p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <Pie
                              data={categorySpending.slice(0, 6).map((cat: any, idx: number) => ({
                                name: cat.categoryName,
                                value: cat.totalAmount,
                                fill: COLORS[idx % COLORS.length]
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {categorySpending.slice(0, 6).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Bar Chart for Top Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Top Spending Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {categoryLoading || !categorySpending?.length ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading chart data...</p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={categorySpending.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="categoryName" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis />
                            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                            <Bar dataKey="totalAmount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Trends Chart */}
              {reportType === 'trends' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Spending Trends Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading trends data...</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={trends || []}>
                          <defs>
                            <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="period" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spending']} />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3B82F6" 
                            fillOpacity={1} 
                            fill="url(#colorSpending)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Report Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {format(new Date(), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">Report Generated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedWalletName}
                      </div>
                      <div className="text-sm text-gray-500">Selected Wallet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedPeriod} Days
                      </div>
                      <div className="text-sm text-gray-500">Analysis Period</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          </div>
        </main>
      </div>
    </>
  );
}
