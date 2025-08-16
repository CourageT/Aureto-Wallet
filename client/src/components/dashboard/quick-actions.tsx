import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown, Target, Wallet } from 'lucide-react';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import CreateWalletModal from '@/components/modals/create-wallet-modal';
import { useLocation } from 'wouter';

const quickActions = [
  {
    id: 'add-transaction',
    title: 'Add Transaction',
    description: 'Record income or expense',
    icon: Plus,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    shadowColor: 'shadow-blue-200',
  },
  {
    id: 'transfer',
    title: 'Transfer',
    description: 'Move money between wallets',
    icon: ArrowUpDown,
    color: 'bg-gradient-to-br from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
    shadowColor: 'shadow-green-200',
  },
  {
    id: 'create-wallet',
    title: 'New Wallet',
    description: 'Create shared or personal wallet',
    icon: Wallet,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    shadowColor: 'shadow-purple-200',
  },
  {
    id: 'set-goal',
    title: 'Set Goal',
    description: 'Create savings target',
    icon: Target,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    shadowColor: 'shadow-orange-200',
  },
];

export default function QuickActions() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
  const [, navigate] = useLocation();

  const handleActionClick = (actionId: string) => {
    switch (actionId) {
      case 'add-transaction':
        setIsAddTransactionOpen(true);
        break;
      case 'create-wallet':
        setIsCreateWalletOpen(true);
        break;
      case 'transfer':
        // TODO: Implement transfer between wallets
        console.log('Transfer functionality coming soon');
        break;
      case 'set-goal':
        navigate('/goals');
        break;
    }
  };

  return (
    <>
      <Card className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  className={`
                    h-auto p-6 flex flex-col items-center justify-center gap-3
                    ${action.color} ${action.hoverColor} text-white
                    hover:text-white border-0 rounded-xl
                    min-h-[120px] transition-all duration-200 transform hover:scale-105
                    shadow-lg ${action.shadowColor} hover:shadow-xl group
                  `}
                  onClick={() => handleActionClick(action.id)}
                  data-testid={`button-${action.id}`}
                >
                  <Icon className="h-8 w-8 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  <div className="text-center space-y-1">
                    <p className="text-base font-semibold leading-tight">{action.title}</p>
                    <p className="text-sm opacity-90 leading-tight">{action.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />
      
      <CreateWalletModal
        isOpen={isCreateWalletOpen}
        onClose={() => setIsCreateWalletOpen(false)}
      />
    </>
  );
}
