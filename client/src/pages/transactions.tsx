import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddTransactionModal from "@/components/modals/add-transaction-modal";
import { Badge } from "@/components/ui/badge";

const getCategoryIcon = (categoryName: string) => {
  const icons: Record<string, string> = {
    'Food & Dining': 'fas fa-shopping-cart',
    'Transportation': 'fas fa-gas-pump',
    'Entertainment': 'fas fa-film',
    'Housing': 'fas fa-home',
    'Healthcare': 'fas fa-heart',
    'Personal Care': 'fas fa-user',
    'Education': 'fas fa-book',
    'Income': 'fas fa-plus',
    'Miscellaneous': 'fas fa-more-horizontal',
  };
  return icons[categoryName] || 'fas fa-receipt';
};

const getCategoryColor = (categoryName: string) => {
  const colors: Record<string, string> = {
    'Food & Dining': 'red',
    'Transportation': 'blue',
    'Entertainment': 'purple',
    'Housing': 'green',
    'Healthcare': 'pink',
    'Personal Care': 'indigo',
    'Education': 'yellow',
    'Income': 'green',
    'Miscellaneous': 'gray',
  };
  return colors[categoryName] || 'gray';
};

export default function Transactions() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle the redirect
  }

  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Get transactions from all wallets
  const walletQueries = useQuery({
    queryKey: ["/api/transactions/all"],
    queryFn: async () => {
      if (!wallets?.length) return [];
      
      const allTransactions = [];
      for (const wallet of wallets) {
        try {
          const response = await fetch(`/api/wallets/${wallet.id}/transactions?limit=100`);
          if (response.ok) {
            const transactions = await response.json();
            allTransactions.push(...transactions);
          }
        } catch (error) {
          console.error(`Error fetching transactions for wallet ${wallet.id}:`, error);
        }
      }
      
      // Sort by date descending
      return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!wallets?.length,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const transactions = walletQueries.data || [];
  
  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesWallet = selectedWallet === 'all' || transaction.walletId === selectedWallet;
    const matchesCategory = selectedCategory === 'all' || transaction.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesWallet && matchesCategory && matchesSearch;
  });

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
            <TopBar title="Transactions" subtitle="View and manage all your financial transactions" />
          </div>
          
          <div className="p-3 md:p-6 pt-16 md:pt-6 pb-24 md:pb-6">
            {/* Filters and Search */}
            <Card className="mb-4 md:mb-6">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">Filter Transactions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
                    <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                      <SelectTrigger>
                        <SelectValue placeholder="All wallets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wallets</SelectItem>
                        {wallets?.map((wallet: any) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={() => setIsAddTransactionOpen(true)}
                      className="btn-primary w-full text-sm md:text-base"
                    >
                      <i className="fas fa-plus text-sm mr-2"></i>
                      <span className="hidden sm:inline">Add Transaction</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Transactions ({filteredTransactions.length})
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    {selectedWallet !== 'all' && `Filtered by wallet`}
                    {selectedCategory !== 'all' && `${selectedWallet !== 'all' ? ' and' : 'Filtered by'} category`}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {walletQueries.isLoading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-receipt text-gray-400 text-xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {transactions.length === 0 
                        ? 'Start tracking your expenses by adding your first transaction.'
                        : 'Try adjusting your filters to see more results.'
                      }
                    </p>
                    {transactions.length === 0 && (
                      <Button
                        onClick={() => setIsAddTransactionOpen(true)}
                        className="btn-primary"
                      >
                        <i className="fas fa-plus text-sm mr-2"></i>
                        Add Your First Transaction
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {filteredTransactions.map((transaction: any) => {
                      const color = getCategoryColor(transaction.category?.name || 'Miscellaneous');
                      const icon = getCategoryIcon(transaction.category?.name || 'Miscellaneous');
                      
                      return (
                        <div key={transaction.id} className="flex items-start justify-between p-3 md:p-4 bg-white md:bg-gray-50 rounded-lg border md:border-0 hover:bg-gray-100 transition-colors shadow-sm md:shadow-none">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {/* Category Icon with emoji fallback */}
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-lg md:text-xl">
                                {transaction.category?.icon || '📋'}
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Main content */}
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 text-sm md:text-base truncate">
                                    {transaction.description || 'Transaction'}
                                  </h3>
                                  
                                  {/* Mobile: Stack info vertically */}
                                  <div className="mt-1 space-y-1 md:hidden">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">{transaction.category?.name}</span>
                                      <span className="text-gray-300">•</span>
                                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                        {transaction.wallet?.name}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <span>
                                        {new Date(transaction.date).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                      <span className="text-gray-300">•</span>
                                      <span>by {transaction.creator?.firstName || 'User'}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Desktop: Horizontal layout */}
                                  <div className="hidden md:flex items-center space-x-3 mt-1">
                                    <p className="text-sm text-gray-500">{transaction.category?.name}</p>
                                    <span className="text-gray-300">•</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {transaction.wallet?.name}
                                    </Badge>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-gray-500">
                                      {new Date(transaction.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-gray-500">
                                      by {transaction.creator?.firstName || transaction.creator?.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Amount - right aligned */}
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className={`text-base md:text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 capitalize">
                              {transaction.type}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />
    </>
  );
}
