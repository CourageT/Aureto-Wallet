import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function MonthlyBudget() {
  const { data: budgets, isLoading } = useQuery({
    queryKey: ["/api/budgets"],
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-semibold text-gray-900">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Monthly Budget</CardTitle>
          <Link href="/budgets">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {Array.isArray(budgets) && budgets.length > 0 ? (
            budgets.slice(0, 3).map((budget: any) => {
              const spent = budget.spent || 0;
              const percentage = (spent / budget.amount) * 100;
              return (
                <div key={budget.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 flex items-center gap-2">
                      <span>{budget.category?.icon}</span>
                      {budget.category?.name}
                    </span>
                    <span className="font-medium">
                      ${spent.toFixed(0)} / ${budget.amount.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No budgets set up yet</p>
              <Link href="/budgets">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Budget
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {Array.isArray(budgets) && budgets.length > 3 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link href="/budgets">
              <Button variant="ghost" size="sm" className="w-full">
                View All Budgets ({budgets?.length || 0})
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
