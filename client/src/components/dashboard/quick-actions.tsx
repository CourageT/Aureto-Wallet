import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddTransactionModal from "@/components/modals/add-transaction-modal";
import CreateWalletModal from "@/components/modals/create-wallet-modal";
import InviteUserModal from "@/components/modals/invite-user-modal";

export default function QuickActions() {
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);

  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3">
            <Button
              onClick={() => setIsAddIncomeOpen(true)}
              className="w-full flex items-center space-x-3 p-3 text-left bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
              variant="ghost"
            >
              <i className="fas fa-plus-circle"></i>
              <span>Add Income</span>
            </Button>
            <Button
              onClick={() => setIsAddExpenseOpen(true)}
              className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              variant="ghost"
            >
              <i className="fas fa-minus-circle"></i>
              <span>Add Expense</span>
            </Button>
            <Button
              onClick={() => setIsCreateWalletOpen(true)}
              className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              variant="ghost"
            >
              <i className="fas fa-wallet"></i>
              <span>Create Wallet</span>
            </Button>
            <Button
              onClick={() => setIsInviteUserOpen(true)}
              className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              variant="ghost"
            >
              <i className="fas fa-user-plus"></i>
              <span>Invite User</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddTransactionModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        defaultType="income"
      />
      <AddTransactionModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        defaultType="expense"
      />
      <CreateWalletModal
        isOpen={isCreateWalletOpen}
        onClose={() => setIsCreateWalletOpen(false)}
      />
      <InviteUserModal
        isOpen={isInviteUserOpen}
        onClose={() => setIsInviteUserOpen(false)}
      />
    </>
  );
}
