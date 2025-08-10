import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth } from "date-fns";

const budgetSchema = z.object({
  walletId: z.string().min(1, "Please select a wallet"),
  categoryId: z.string().min(1, "Please select a category"),
  amount: z.string().min(1, "Amount is required"),
  period: z.enum(["monthly", "weekly", "yearly"]),
  alertThreshold: z.string().optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export default function Budgets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const queryClient = useQueryClient();

  // Budget templates for quick setup
  const budgetTemplates = [
    { id: "essential", name: "Essential Expenses", description: "Basic monthly needs", categories: ["🏠 Housing", "🍕 Food & Dining", "🚗 Transportation"], amounts: [1200, 400, 300] },
    { id: "balanced", name: "Balanced Budget", description: "Well-rounded financial plan", categories: ["🏠 Housing", "🍕 Food & Dining", "🎯 Entertainment", "💰 Savings"], amounts: [1000, 350, 200, 500] },
    { id: "student", name: "Student Budget", description: "Budget for students", categories: ["📚 Education", "🍕 Food & Dining", "🚗 Transportation"], amounts: [800, 250, 150] },
    { id: "family", name: "Family Budget", description: "Complete family expenses", categories: ["🏠 Housing", "🍕 Food & Dining", "👶 Childcare", "🎯 Entertainment"], amounts: [1500, 600, 400, 200] }
  ];

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      period: "monthly",
      alertThreshold: "80",
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch data
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: isAuthenticated,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const { data: budgets, isLoading: budgetsLoading, refetch: refetchBudgets } = useQuery({
    queryKey: ["/api/budgets"],
    enabled: isAuthenticated,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const budgetData = {
        ...data,
        amount: parseFloat(data.amount),
        alertThreshold: data.alertThreshold ? parseFloat(data.alertThreshold) : 80,
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
      };
      return await apiRequest("/api/budgets", "POST", budgetData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget created successfully!",
      });
      form.reset();
      setIsCreateOpen(false);
      refetchBudgets();
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BudgetFormData }) => {
      const budgetData = {
        ...data,
        amount: parseFloat(data.amount),
        alertThreshold: data.alertThreshold ? parseFloat(data.alertThreshold) : 80,
      };
      return await apiRequest(`/api/budgets/${id}`, "PUT", budgetData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget updated successfully!",
      });
      setEditingBudget(null);
      setIsCreateOpen(false);
      form.reset();
      refetchBudgets();
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update budget",
        variant: "destructive",
      });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/budgets/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget deleted successfully!",
      });
      refetchBudgets();
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete budget",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, data });
    } else {
      createBudgetMutation.mutate(data);
    }
    setIsCreateOpen(false);
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    form.setValue("walletId", budget.walletId);
    form.setValue("categoryId", budget.categoryId);
    form.setValue("amount", parseFloat(budget.amount || 0).toString());
    form.setValue("period", budget.period);
    form.setValue("alertThreshold", budget.alertThreshold?.toString() || "80");
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <MobileNavigation />
      
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto">
          <div className="hidden md:block">
            <TopBar title="Budget Management" subtitle="Track and manage your spending budgets" />
          </div>
          
          <div className="p-4 md:p-6 space-y-4 md:space-y-6 pt-20 md:pt-4 pb-24 md:pb-6">
            {/* Header with Create Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:hidden">Budget Management</h1>
                <p className="text-gray-500 md:hidden">Track and manage your spending budgets</p>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingBudget(null); form.reset(); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
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
                                <SelectTrigger>
                                  <SelectValue placeholder="Select wallet" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(wallets) && wallets.map((wallet: any) => (
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
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(categories) && categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.icon} {category.name}
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
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="Enter amount" 
                                {...field} 
                              />
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
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
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
                              <Input 
                                type="number" 
                                min="1" 
                                max="100" 
                                placeholder="80" 
                                {...field} 
                              />
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
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}
                          className="flex-1"
                        >
                          {createBudgetMutation.isPending || updateBudgetMutation.isPending ? 
                            "Saving..." : editingBudget ? "Update" : "Create"
                          }
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Budget Overview Cards */}
            {budgetsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-2 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Array.isArray(budgets) && budgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets && budgets.map((budget: any) => {
                  const { status, color } = getBudgetStatus(budget);
                  const amount = parseFloat(budget.amount || 0);
                  const percentage = amount > 0 ? Math.min((budget.spent / amount) * 100, 100) : 0;
                  
                  return (
                    <Card key={budget.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{budget.category?.icon}</span>
                            <CardTitle className="text-lg">{budget.category?.name}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(budget)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(budget.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Wallet className="w-4 h-4" />
                          {budget.wallet?.name}
                          <Badge variant={status === "over" ? "destructive" : status === "warning" ? "secondary" : "default"}>
                            {budget.period}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold">
                              ${budget.spent?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-gray-500">
                              of ${parseFloat(budget.amount || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <Progress 
                              value={percentage} 
                              className={`h-3 ${
                                color === "red" ? "bg-red-100" : 
                                color === "yellow" ? "bg-yellow-100" : 
                                "bg-green-100"
                              }`}
                            />
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${
                                color === "red" ? "text-red-600" : 
                                color === "yellow" ? "text-yellow-600" : 
                                "text-green-600"
                              }`}>
                                {percentage.toFixed(1)}% used
                              </span>
                              <span className="text-gray-500">
                                ${(parseFloat(budget.amount || 0) - (budget.spent || 0)).toFixed(2)} left
                              </span>
                            </div>
                          </div>
                          
                          {status === "over" && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              Budget exceeded
                            </div>
                          )}
                          
                          {status === "warning" && (
                            <div className="flex items-center gap-2 text-yellow-600 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              Near budget limit
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first budget to start tracking your spending limits.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Budget
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Budget Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose Budget Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {budgetTemplates.map((template) => (
              <Card key={template.id} className={`cursor-pointer transition-all ${selectedTemplate === template.id ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'}`} onClick={() => setSelectedTemplate(template.id)}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {template.categories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{category}</span>
                        <span className="font-medium">${template.amounts[index]}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-medium">
                        <span>Total</span>
                        <span>${template.amounts.reduce((sum, amount) => sum + amount, 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTemplate) {
                  const template = budgetTemplates.find(t => t.id === selectedTemplate);
                  if (template) {
                    // Apply template logic here
                    toast({
                      title: "Template Applied",
                      description: `${template.name} template will be applied to your budgets.`,
                    });
                    setShowTemplatesDialog(false);
                    setSelectedTemplate("");
                  }
                }
              }}
              disabled={!selectedTemplate}
            >
              Apply Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}