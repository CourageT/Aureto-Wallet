import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown, Target, Wallet } from 'lucide-react';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import CreateWalletModal from '@/components/modals/create-wallet-modal';

const quickActions = [
  {
    id: 'add-transaction',
    title: 'Add Transaction',
    description: 'Record income or expense',
    icon: Plus,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
  },
  {
    id: 'transfer',
    title: 'Transfer',
    description: 'Move money between wallets',
    icon: ArrowUpDown,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
  },
  {
    id: 'create-wallet',
    title: 'New Wallet',
    description: 'Create shared or personal wallet',
    icon: Wallet,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
  },
  {
    id: 'set-goal',
    title: 'Set Goal',
    description: 'Create savings target',
    icon: Target,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
  },
];

export default function MobileQuickActions() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);

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
        // Navigate to goals page
        window.location.href = '/goals';
        break;
    }
  };

  return (
    <>
      <Card className="md:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  className={`
                    h-auto p-4 flex flex-col items-center justify-center gap-2 
                    ${action.color} ${action.hoverColor} text-white
                    hover:text-white border-0 rounded-lg
                    min-h-[100px] aspect-square
                  `}
                  onClick={() => handleActionClick(action.id)}
                >
                  <Icon className="h-7 w-7 flex-shrink-0" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold leading-tight">{action.title}</p>
                    <p className="text-xs opacity-90 leading-tight line-clamp-2">{action.description}</p>
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