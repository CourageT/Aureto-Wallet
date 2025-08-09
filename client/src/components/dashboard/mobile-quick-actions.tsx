import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown, Target, Users, Wallet } from 'lucide-react';
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
        // Handle transfer action
        break;
      case 'set-goal':
        // Handle set goal action
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
                    h-auto p-4 flex flex-col gap-2 touch-friendly
                    ${action.color} ${action.hoverColor} text-white
                    hover:text-white border-0
                  `}
                  onClick={() => handleActionClick(action.id)}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs opacity-90">{action.description}</p>
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