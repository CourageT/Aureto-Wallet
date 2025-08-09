import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddTransactionModal from "@/components/modals/add-transaction-modal";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <i className="fas fa-bars text-lg"></i>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full"></span>
            </button>
            
            <Button
              onClick={() => setIsAddTransactionOpen(true)}
              className="btn-primary px-4 py-2"
            >
              <i className="fas fa-plus text-sm mr-2"></i>
              Add Transaction
            </Button>
          </div>
        </div>
      </header>

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />
    </>
  );
}
