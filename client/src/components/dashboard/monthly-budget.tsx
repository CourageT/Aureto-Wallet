import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function MonthlyBudget() {
  // This would be fetched from the API in a real implementation
  const budgets = [
    { category: "Food & Dining", spent: 640, total: 800, color: "success" },
    { category: "Transportation", spent: 320, total: 400, color: "warning" },
    { category: "Entertainment", spent: 180, total: 200, color: "error" },
  ];

  const getColorClass = (color: string) => {
    switch (color) {
      case "success": return "bg-success-500";
      case "warning": return "bg-warning-500";
      case "error": return "bg-error-500";
      default: return "bg-primary-500";
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6">
        <CardTitle className="text-lg font-semibold text-gray-900">Monthly Budget</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.total) * 100;
            return (
              <div key={budget.category}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{budget.category}</span>
                  <span className="font-medium">
                    ${budget.spent} / ${budget.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getColorClass(budget.color)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {budgets.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No budgets set up yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
