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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, ShoppingCart, Car, Heart, Baby, GraduationCap, Plane, AlertTriangle, Edit, Trash2, Users, Target, CheckCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth } from "date-fns";

const householdBudgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  walletId: z.string().min(1, "Please select a wallet"),
  categoryId: z.string().min(1, "Please select a category"),
  amount: z.string().min(1, "Amount is required"),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  alertThreshold: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
});

type HouseholdBudgetFormData = z.infer<typeof householdBudgetSchema>;

export default function HouseholdBudgets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  const form = useForm<HouseholdBudgetFormData>({
    resolver: zodResolver(householdBudgetSchema),
    defaultValues: {
      period: "monthly",
      alertThreshold: "80",
      priority: "medium",
    },
  });

  // Household budget categories with realistic amounts
  const householdCategories = [
    { id: "housing", name: "🏠 Housing & Utilities", icon: Home, amount: 1500, description: "Rent, mortgage, electricity, water" },
    { id: "groceries", name: "🛒 Groceries & Food", icon: ShoppingCart, amount: 600, description: "Weekly groceries, household supplies" },
    { id: "transportation", name: "🚗 Transportation", icon: Car, amount: 400, description: "Gas, car payments, public transit" },
    { id: "healthcare", name: "❤️ Healthcare", icon: Heart, amount: 300, description: "Insurance, doctor visits, medications" },
    { id: "childcare", name: "👶 Childcare & Education", icon: Baby, amount: 800, description: "Daycare, school fees, activities" },
    { id: "education", name: "🎓 Education", icon: GraduationCap, amount: 200, description: "Books, courses, learning materials" },
    { id: "entertainment", name: "🎯 Entertainment & Dining", icon: Target, amount: 250, description: "Movies, restaurants, hobbies" },
    { id: "travel", name: "✈️ Travel & Vacation", icon: Plane, amount: 300, description: "Family trips, vacation fund" },
    { id: "savings", name: "💰 Emergency & Savings", icon: Target, amount: 500, description: "Emergency fund, future goals" },
  ];

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

  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: isAuthenticated,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const { data: budgets, refetch: refetchBudgets } = useQuery({
    queryKey: ["/api/budgets"],
    enabled: isAuthenticated,
  });

  const walletsArray = Array.isArray(wallets) ? wallets : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  const budgetsArray = Array.isArray(budgets) ? budgets : [];

  // Create household budget with template
  const createHouseholdBudget = async (template: any) => {
    if (walletsArray.length === 0) {
      toast({
        title: "Error",
        description: "Please create a wallet first",
        variant: "destructive",
      });
      return;
    }

    const budgetData = {
      name: template.name,
      walletId: walletsArray[0].id,
      categoryId: categoriesArray.find((c: any) => c.name.toLowerCase().includes(template.id))?.id || categoriesArray[0]?.id,
      amount: template.amount,
      period: "monthly",
      alertThreshold: 80,
      description: template.description,
      priority: "high",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    };

    try {
      await apiRequest("/api/budgets", "POST", budgetData);
      toast({
        title: "Success",
        description: `${template.name} budget created successfully!`,
      });
      refetchBudgets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create budget",
        variant: "destructive",
      });
    }
  };

  // Quick setup for household budgets
  const setupCompleteHouseholdBudget = async () => {
    if (walletsArray.length === 0) {
      toast({
        title: "Error", 
        description: "Please create a wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create all essential household budget categories
      const promises = householdCategories.map(async (category) => {
        const budgetData = {
          name: category.name,
          walletId: walletsArray[0].id,
          categoryId: categoriesArray.find((c: any) => c.name.toLowerCase().includes(category.id))?.id || categoriesArray[0]?.id,
          amount: category.amount,
          period: "monthly",
          alertThreshold: 80,
          description: category.description,
          priority: category.id === "housing" || category.id === "groceries" ? "high" : "medium",
          startDate: startOfMonth(new Date()),
          endDate: endOfMonth(new Date()),
        };
        return apiRequest("/api/budgets", "POST", budgetData);
      });

      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: "Complete household budget created with 9 categories!",
      });
      refetchBudgets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create household budget",
        variant: "destructive",
      });
    }
  };

  const getBudgetStatus = (budget: any) => {
    const spent = budget.spent || 0;
    const amount = parseFloat(budget.amount || 0);
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;
    
    if (percentage >= 100) return { status: "over", color: "red", message: "Over Budget" };
    if (percentage >= (budget.alertThreshold || 80)) return { status: "warning", color: "yellow", message: "Near Limit" };
    return { status: "good", color: "green", message: "On Track" };
  };

  const totalBudgeted = budgetsArray.reduce((sum: number, budget: any) => sum + parseFloat(budget.amount || 0), 0);
  const totalSpent = budgetsArray.reduce((sum: number, budget: any) => sum + (budget.spent || 0), 0);
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading household budget management...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <MobileNavigation />
      
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto">
          <div className="hidden md:block">
            <TopBar title="Household Budget Management" subtitle="Complete family budget planning and tracking" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
            {/* Header with Quick Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Household Budget Manager</h1>
                <p className="text-gray-500">Manage your family's complete financial plan</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={setupCompleteHouseholdBudget}>
                  <Users className="w-4 h-4 mr-2" />
                  Setup Complete Budget
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Budget Item
                </Button>
              </div>
            </div>

            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Budgeted</p>
                      <p className="text-2xl font-bold text-gray-900">${totalBudgeted.toLocaleString()}</p>
                    </div>
                    <Target className="w-8 h-8 text-primary-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Remaining</p>
                      <p className="text-2xl font-bold text-green-600">${(totalBudgeted - totalSpent).toLocaleString()}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Budget Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{overallPercentage.toFixed(1)}%</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="categories">By Category</TabsTrigger>
                <TabsTrigger value="templates">Quick Setup</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                {budgetsArray.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgetsArray.map((budget: any) => {
                      const { status, color, message } = getBudgetStatus(budget);
                      const percentage = Math.min((budget.spent || 0) / parseFloat(budget.amount || 0) * 100, 100);
                      
                      return (
                        <Card key={budget.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{budget.name || budget.category?.name}</CardTitle>
                                <p className="text-sm text-gray-500">{budget.category?.icon} {budget.wallet?.name}</p>
                              </div>
                              <Badge variant={status === "good" ? "default" : status === "warning" ? "secondary" : "destructive"}>
                                {message}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span>Budget: ${parseFloat(budget.amount || 0).toFixed(2)}</span>
                                <span>Spent: ${(budget.spent || 0).toFixed(2)}</span>
                              </div>
                              <Progress value={percentage} className={`h-2 ${status === 'good' ? 'bg-green-100' : status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'}`} />
                              <div className="flex justify-between items-center text-sm">
                                <span className={status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'}>
                                  {percentage.toFixed(1)}% used
                                </span>
                                <span className="text-gray-500">
                                  ${(parseFloat(budget.amount || 0) - (budget.spent || 0)).toFixed(2)} left
                                </span>
                              </div>
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No household budgets yet</h3>
                      <p className="text-gray-500 mb-4">
                        Set up your family's complete budget to track all expenses and stay on target.
                      </p>
                      <Button onClick={setupCompleteHouseholdBudget}>
                        <Users className="w-4 h-4 mr-2" />
                        Setup Complete Household Budget
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {householdCategories.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => createHouseholdBudget(template)}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <template.icon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <p className="text-sm text-gray-500">${template.amount}/month</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <Button size="sm" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Budget
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
}