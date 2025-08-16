import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileNavigation from "@/components/layout/mobile-navigation";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, PiggyBank, Package } from "lucide-react";
import BudgetItemManager from "@/components/budget-item-manager";
import PurchaseForm from "@/components/purchase-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const budgetSchema = z.object({
  walletId: z.string().min(1, "Please select a wallet"),
  categoryId: z.string().min(1, "Please select a category"),
  name: z.string().min(1, "Budget name is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"]),
  budgetType: z.enum(["category", "detailed", "mixed"]),
  alertThreshold: z.string().optional(),
});

const budgetItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  unit: z.string().optional(),
  plannedQuantity: z.string().optional(),
  plannedUnitPrice: z.string().optional(),
  plannedAmount: z.string().min(1, "Planned amount is required"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;
type BudgetItemFormData = z.infer<typeof budgetItemSchema>;

export default function Budgets() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [currentBudgetType, setCurrentBudgetType] = useState<string>("category");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Forms
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      walletId: "",
      categoryId: "",
      name: "",
      description: "",
      amount: "",
      period: "monthly",
      budgetType: "category",
      alertThreshold: "80",
    },
  });

  const itemForm = useForm<BudgetItemFormData>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "items",
      plannedQuantity: "1",
      plannedUnitPrice: "",
      plannedAmount: "",
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading budgets...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle the redirect
  }

  // Fetch data
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<any[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: wallets = [] } = useQuery<any[]>({
    queryKey: ["/api/wallets"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Budget Mutations
  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: any) => {
      return await apiRequest("/api/budgets", "POST", budgetData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, budgetData }: { id: string; budgetData: any }) => {
      return await apiRequest(`/api/budgets/${id}`, "PUT", budgetData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setIsCreateOpen(false);
      setEditingBudget(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update budget",
        variant: "destructive",
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      return await apiRequest(`/api/budgets/${budgetId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete budget",
        variant: "destructive",
      });
    },
  });

  // Purchase Mutation
  const recordPurchaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/budget-items/${id}/purchase`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase recorded successfully!",
      });
      // Invalidate both budget items and main budgets cache to update progress display
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${selectedBudget?.id}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setIsPurchaseDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record purchase",
        variant: "destructive",
      });
    },
  });

  // Budget Item Mutations
  const createItemMutation = useMutation({
    mutationFn: async ({ budgetId, data }: { budgetId: string; data: any }) => {
      return await apiRequest(`/api/budgets/${budgetId}/items`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget item created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${selectedBudget?.id}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setIsItemDialogOpen(false);
      itemForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create budget item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/budget-items/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget item updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${selectedBudget?.id}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      itemForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update budget item",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const calculatePeriodDates = (period: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };

  const onSubmit = (data: BudgetFormData) => {
    const { startDate, endDate } = calculatePeriodDates(data.period);
    
    const budgetData = {
      ...data,
      amount: parseFloat(data.amount),
      alertThreshold: data.alertThreshold ? parseInt(data.alertThreshold) : 80,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, budgetData });
    } else {
      createBudgetMutation.mutate(budgetData);
    }
  };

  // Auto-calculate planned amount when quantity or unit price changes
  const calculatePlannedAmount = () => {
    const quantity = parseFloat(itemForm.getValues("plannedQuantity") || "0");
    const unitPrice = parseFloat(itemForm.getValues("plannedUnitPrice") || "0");
    const total = quantity * unitPrice;
    
    if (total > 0) {
      itemForm.setValue("plannedAmount", total.toFixed(2));
    }
  };

  const onItemSubmit = (data: BudgetItemFormData) => {
    const itemData = {
      ...data,
      plannedQuantity: data.plannedQuantity ? parseFloat(data.plannedQuantity) : 1,
      plannedUnitPrice: data.plannedUnitPrice ? parseFloat(data.plannedUnitPrice) : 0,
      plannedAmount: parseFloat(data.plannedAmount),
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemData });
    } else if (selectedBudget) {
      createItemMutation.mutate({ budgetId: selectedBudget.id, data: itemData });
    }
  };

  const onPurchaseSubmit = (data: any) => {
    if (selectedItem) {
      const purchaseData = {
        actualQuantity: parseFloat(data.actualQuantity),
        actualUnitPrice: parseFloat(data.actualUnitPrice),
        actualAmount: parseFloat(data.actualAmount),
        notes: data.notes,
      };
      recordPurchaseMutation.mutate({ id: selectedItem.id, data: purchaseData });
    }
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    form.setValue("walletId", budget.walletId);
    form.setValue("categoryId", budget.categoryId);
    form.setValue("name", budget.name || "");
    form.setValue("description", budget.description || "");
    form.setValue("amount", parseFloat(budget.amount || 0).toString());
    form.setValue("period", budget.period);
    form.setValue("budgetType", budget.budgetType || "category");
    form.setValue("alertThreshold", budget.alertThreshold?.toString() || "80");
    setCurrentBudgetType(budget.budgetType || "category");
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      deleteBudgetMutation.mutate(id);
    }
  };

  const getBudgetStatus = (budget: any) => {
    const spent = budget.spent || 0;
    const amount = parseFloat(budget.amount || 0);
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;
    
    if (percentage >= 100) return { status: "over", color: "red" };
    if (percentage >= (budget.alertThreshold || 80)) return { status: "warning", color: "yellow" };
    return { status: "good", color: "green" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading budget management...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <MobileNavigation />
      
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Mobile-friendly header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-3">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Budget Management</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">Track and manage your spending budgets</p>
              </div>
              <Button 
                onClick={() => {
                  setEditingBudget(null);
                  form.reset();
                  setIsCreateOpen(true);
                }} 
                className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] text-sm md:text-base"
              >
                <Plus className="w-4 h-4" />
                Create Budget
              </Button>
            </div>
            
            {/* Budget List - Mobile Optimized */}
            <div className="space-y-4">
              {budgetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
              ) : budgets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mb-4">
                      <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
                      <p className="text-gray-500 mb-4">Start managing your finances by creating your first budget</p>
                      <Button onClick={() => setIsCreateOpen(true)} className="min-h-[44px]">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Budget
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                budgets.map((budget: any) => {
                  const status = getBudgetStatus(budget);
                  const progressPercentage = budget.amount > 0 ? Math.min(((budget.spent || 0) / parseFloat(budget.amount)) * 100, 100) : 0;
                  
                  return (
                    <Card key={budget.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                              <span className="truncate">{budget.name}</span>
                              <Badge 
                                variant={status.status === "good" ? "default" : status.status === "warning" ? "secondary" : "destructive"}
                                className="text-xs self-start sm:self-center"
                              >
                                {status.status === "good" ? "On Track" : status.status === "warning" ? "Warning" : "Over Budget"}
                              </Badge>
                            </CardTitle>
                            {budget.description && (
                              <p className="text-sm text-gray-500 mb-2">{budget.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="bg-gray-100 px-2 py-1 rounded-full">
                                {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                              </span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {budget.budgetType === "category" ? "Category" : budget.budgetType === "detailed" ? "Item-Level" : "Mixed"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-2 min-w-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(budget)}
                              className="flex-1 sm:flex-none min-h-[36px] text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(budget.id)}
                              className="flex-1 sm:flex-none min-h-[36px] text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Budget Progress */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Budget Progress</span>
                            <span className="font-medium">
                              ${(budget.spent || 0).toFixed(2)} / ${parseFloat(budget.amount || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          <Progress 
                            value={progressPercentage} 
                            className="h-2"
                          />
                          
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{progressPercentage.toFixed(1)}% used</span>
                            <span>
                              {progressPercentage < 100 
                                ? `$${(parseFloat(budget.amount || 0) - (budget.spent || 0)).toFixed(2)} remaining`
                                : `$${((budget.spent || 0) - parseFloat(budget.amount || 0)).toFixed(2)} over budget`
                              }
                            </span>
                          </div>
                        </div>
                        
                        {/* Item-level budgeting actions */}
                        {(budget.budgetType === "detailed" || budget.budgetType === "mixed") && (
                          <div className="mt-4 pt-3 border-t">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedBudget(budget)}
                              className="w-full min-h-[44px] text-sm"
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Manage Items ({budget.itemCount || 0})
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Create/Edit Budget Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Edit Budget" : "Create New Budget"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select a wallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet: any) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Monthly Groceries" {...field} className="min-h-[44px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budgetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Type</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setCurrentBudgetType(value);
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select budget type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="category">Category Budget</SelectItem>
                        <SelectItem value="detailed">Detailed Item Budget</SelectItem>
                        <SelectItem value="mixed">Mixed Budget</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="500.00" {...field} className="min-h-[44px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Budget description..." {...field} className="min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Threshold (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="100" placeholder="80" {...field} className="min-h-[44px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}
                  className="flex-1 min-h-[44px]"
                >
                  {createBudgetMutation.isPending || updateBudgetMutation.isPending
                    ? "Saving..."
                    : editingBudget
                    ? "Update Budget"
                    : "Create Budget"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Budget Item Management Dialog */}
      {selectedBudget && (
        <Dialog open={!!selectedBudget} onOpenChange={() => setSelectedBudget(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Manage Items - {selectedBudget.name}
              </DialogTitle>
            </DialogHeader>
            
            <BudgetItemManager
              budget={selectedBudget}
              onAddItem={() => {
                setEditingItem(null);
                itemForm.reset();
                setIsItemDialogOpen(true);
              }}
              onEditItem={(item) => {
                setEditingItem(item);
                itemForm.setValue("name", item.name || "");
                itemForm.setValue("description", item.description || "");
                itemForm.setValue("unit", item.unit || "items");
                itemForm.setValue("plannedQuantity", item.plannedQuantity?.toString() || "1");
                itemForm.setValue("plannedUnitPrice", item.plannedUnitPrice?.toString() || "");
                itemForm.setValue("plannedAmount", item.plannedAmount?.toString() || "");
                setIsItemDialogOpen(true);
              }}
              onRecordPurchase={(item) => {
                setSelectedItem(item);
                setIsPurchaseDialogOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Budget Item Create/Edit Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Budget Item" : "Add Budget Item"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Milk, Bread, etc." {...field} className="min-h-[44px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Item details..." {...field} className="min-h-[60px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={itemForm.control}
                  name="plannedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001" 
                          placeholder="1" 
                          {...field} 
                          className="min-h-[44px]"
                          onChange={(e) => {
                            field.onChange(e);
                            setTimeout(calculatePlannedAmount, 100);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={itemForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="items">Items</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="lbs">Pounds</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="gallons">Gallons</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="bottles">Bottles</SelectItem>
                          <SelectItem value="packs">Packs</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={itemForm.control}
                name="plannedUnitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        className="min-h-[44px]"
                        onChange={(e) => {
                          field.onChange(e);
                          setTimeout(calculatePlannedAmount, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="plannedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Total Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} className="min-h-[44px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsItemDialogOpen(false)}
                  className="flex-1 min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="flex-1 min-h-[44px]"
                >
                  {createItemMutation.isPending || updateItemMutation.isPending
                    ? "Saving..."
                    : editingItem
                    ? "Update Item"
                    : "Add Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Purchase Recording Dialog */}
      {selectedItem && (
        <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Purchase - {selectedItem.name}</DialogTitle>
            </DialogHeader>
            
            <PurchaseForm
              item={selectedItem}
              onSubmit={onPurchaseSubmit}
              onCancel={() => setIsPurchaseDialogOpen(false)}
              isLoading={recordPurchaseMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}