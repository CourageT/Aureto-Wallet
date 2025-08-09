import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default function RecentTransactions() {
  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
  });

  const firstWalletId = Array.isArray(wallets) && wallets.length > 0 ? wallets[0]?.id : null;

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/wallets", firstWalletId, "transactions"],
    enabled: !!firstWalletId,
  });

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
          <Button variant="ghost" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-receipt text-gray-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500">Start tracking your expenses by adding your first transaction.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(transactions) ? transactions.slice(0, 4).map((transaction: any) => {
              const color = getCategoryColor(transaction.category.name);
              const icon = getCategoryIcon(transaction.category.name);
              
              return (
                <div key={transaction.id} className="transaction-item">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                      <i className={`${icon} text-${color}-600`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description || 'Transaction'}</p>
                      <p className="text-sm text-gray-500">{transaction.category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            }) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
