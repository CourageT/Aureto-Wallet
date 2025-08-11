import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, ShoppingCart, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BudgetItemManagerProps {
  budget: any;
  onAddItem: () => void;
  onEditItem: (item: any) => void;
  onRecordPurchase: (item: any) => void;
}

export default function BudgetItemManager({ budget, onAddItem, onEditItem, onRecordPurchase }: BudgetItemManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budget items
  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/budgets/${budget.id}/items`],
    enabled: !!budget.id,
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest(`/api/budget-items/${itemId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget item deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${budget.id}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete budget item",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (itemId: string) => {
    if (confirm("Are you sure you want to delete this budget item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const getItemStatus = (item: any) => {
    const planned = parseFloat(item.plannedAmount || 0);
    const actual = parseFloat(item.actualAmount || 0);
    
    if (actual === 0) return { status: "pending", color: "gray" };
    if (actual <= planned) return { status: "good", color: "green" };
    return { status: "over", color: "red" };
  };

  const getVariance = (item: any) => {
    const planned = parseFloat(item.plannedAmount || 0);
    const actual = parseFloat(item.actualAmount || 0);
    const variance = actual - planned;
    
    return {
      amount: Math.abs(variance),
      isOver: variance > 0,
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Budget Items</h3>
          <Button onClick={onAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Budget Items</h3>
        <Button onClick={onAddItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No items yet</h4>
            <p className="text-gray-500 mb-4">
              Add items to track detailed spending within this budget.
            </p>
            <Button onClick={onAddItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const { status, color } = getItemStatus(item);
            const variance = getVariance(item);
            const planned = parseFloat(item.plannedAmount || 0);
            const actual = parseFloat(item.actualAmount || 0);
            const progress = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;

            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header with title and badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <Badge 
                          variant={status === "pending" ? "outline" : status === "good" ? "default" : "destructive"}
                          className="text-xs shrink-0"
                        >
                          {status === "pending" ? "Not Purchased" : status === "good" ? "On Budget" : "Over Budget"}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1 shrink-0 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRecordPurchase(item)}
                          title="Record Purchase"
                          className="h-8 w-8 p-0"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditItem(item)}
                          title="Edit Item"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          title="Delete Item"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Quantity and unit price info */}
                    {item.unit && item.plannedQuantity && (
                      <div className="text-sm text-gray-500">
                        {item.plannedQuantity} {item.unit}
                        {item.plannedUnitPrice && ` @ $${parseFloat(item.plannedUnitPrice).toFixed(2)} each`}
                      </div>
                    )}

                    {/* Planned vs Actual amounts */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Planned:</span>
                        <span className="font-medium">${planned.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Actual:</span>
                        <span className={`font-medium ${color === "red" ? "text-red-600" : color === "green" ? "text-green-600" : "text-gray-600"}`}>
                          ${actual.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar and variance */}
                    {actual > 0 && (
                      <div className="space-y-1">
                        <Progress 
                          value={progress} 
                          className={`h-2 ${color === "red" ? "bg-red-100" : "bg-green-100"}`}
                        />
                        {variance.amount > 0 && (
                          <div className={`text-xs ${variance.isOver ? "text-red-600" : "text-green-600"}`}>
                            {variance.isOver ? "Over" : "Under"} by ${variance.amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ${items.reduce((sum: number, item: any) => sum + parseFloat(item.plannedAmount || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Total Planned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${items.reduce((sum: number, item: any) => sum + parseFloat(item.actualAmount || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Total Spent</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  items.reduce((sum: number, item: any) => sum + parseFloat(item.actualAmount || 0), 0) > 
                  items.reduce((sum: number, item: any) => sum + parseFloat(item.plannedAmount || 0), 0) 
                    ? "text-red-600" : "text-green-600"
                }`}>
                  ${Math.abs(
                    items.reduce((sum: number, item: any) => sum + parseFloat(item.actualAmount || 0), 0) - 
                    items.reduce((sum: number, item: any) => sum + parseFloat(item.plannedAmount || 0), 0)
                  ).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {items.reduce((sum: number, item: any) => sum + parseFloat(item.actualAmount || 0), 0) > 
                   items.reduce((sum: number, item: any) => sum + parseFloat(item.plannedAmount || 0), 0) 
                    ? "Over Budget" : "Under Budget"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}