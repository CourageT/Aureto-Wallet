import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'fas fa-tag',
      color: '#3B82F6',
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

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest('POST', '/api/categories', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.reset();
      setIsAddingCategory(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const seedCategoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/seed-categories', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default categories added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to add default categories",
        variant: "destructive",
      });
    },
  });

  const resetProfileMutation = useMutation({
    mutationFn: async (confirmationText: string) => {
      const response = await apiRequest('POST', '/api/users/me/reset', {
        confirmationText,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Reset Complete",
        description: "Your profile has been reset successfully. Refreshing page...",
      });
      // Clear all cached queries and refresh the page
      queryClient.clear();
      setShowResetDialog(false);
      setResetConfirmationText('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResetProfile = () => {
    if (resetConfirmationText === 'delete-all-data-by-courage') {
      resetProfileMutation.mutate(resetConfirmationText);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const onSubmitCategory = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const userCategories = (categories as any[])?.filter((cat: any) => !cat.isDefault) || [];
  const defaultCategories = (categories as any[])?.filter((cat: any) => cat.isDefault) || [];

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      <div className="min-h-screen flex bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto">
          {/* Desktop TopBar */}
          <div className="hidden md:block">
            <TopBar title="Settings" subtitle="Manage your account preferences and categories" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={(user as any)?.email || ''}
                    disabled
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">Your email address cannot be changed.</p>
                </div>
                
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : ''}
                    disabled
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">Managed through your authentication provider.</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
                    <p className="text-sm text-gray-500">Manage your account and session.</p>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/api/logout'}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <i className="fas fa-sign-out-alt text-sm mr-2"></i>
                    Sign Out
                  </Button>
                </div>
              </div>

              {/* Profile Reset Section */}
              <div className="mt-6 pt-6 border-t border-red-200">
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                          Danger Zone
                        </h3>
                        <div className="text-sm text-red-700 mb-4">
                          <p className="mb-2">
                            Reset your entire profile to day one. This will permanently delete all your data including:
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>All wallets and transactions</li>
                            <li>All budgets and spending tracking</li>
                            <li>All financial goals</li>
                            <li>All categories and preferences</li>
                          </ul>
                          <p className="mt-2 font-medium">This action cannot be undone.</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={() => setShowResetDialog(true)}
                        variant="destructive"
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 shadow-lg"
                      >
                        <i className="fas fa-trash mr-2"></i>
                        Reset Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage your expense and income categories</p>
                </div>
                <div className="space-x-2">
                  {defaultCategories.length === 0 && (
                    <Button
                      onClick={() => seedCategoriesMutation.mutate()}
                      disabled={seedCategoriesMutation.isPending}
                      variant="outline"
                    >
                      <i className="fas fa-download text-sm mr-2"></i>
                      Add Default Categories
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsAddingCategory(true)}
                    className="btn-primary"
                  >
                    <i className="fas fa-plus text-sm mr-2"></i>
                    Add Category
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Add Category Form */}
              {isAddingCategory && (
                <Card className="mb-6 border-primary-200 bg-primary-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Create New Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitCategory)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Groceries" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select icon" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="fas fa-shopping-cart">Shopping Cart</SelectItem>
                                    <SelectItem value="fas fa-gas-pump">Gas Pump</SelectItem>
                                    <SelectItem value="fas fa-home">Home</SelectItem>
                                    <SelectItem value="fas fa-heart">Health</SelectItem>
                                    <SelectItem value="fas fa-film">Entertainment</SelectItem>
                                    <SelectItem value="fas fa-user">Personal</SelectItem>
                                    <SelectItem value="fas fa-book">Education</SelectItem>
                                    <SelectItem value="fas fa-tag">Tag</SelectItem>
                                    <SelectItem value="fas fa-more-horizontal">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Brief description of this category..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <div className="flex items-center space-x-4">
                                <FormControl>
                                  <Input type="color" className="w-16 h-10" {...field} />
                                </FormControl>
                                <div className="flex space-x-2">
                                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'].map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                      style={{ backgroundColor: color }}
                                      onClick={() => form.setValue('color', color)}
                                    />
                                  ))}
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddingCategory(false);
                              form.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createCategoryMutation.isPending}
                            className="btn-primary"
                          >
                            {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Categories List */}
              {categoriesLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Default Categories */}
                  {defaultCategories.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Default Categories</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {defaultCategories.map((category: any) => (
                          <div key={category.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <i className={`${category.icon} text-lg`} style={{ color: category.color }}></i>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{category.name}</p>
                              {category.description && (
                                <p className="text-sm text-gray-500">{category.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Categories */}
                  {userCategories.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Custom Categories</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userCategories.map((category: any) => (
                          <div key={category.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <i className={`${category.icon} text-lg`} style={{ color: category.color }}></i>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{category.name}</p>
                              {category.description && (
                                <p className="text-sm text-gray-500">{category.description}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-red-600">
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(categories as any[])?.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-tags text-gray-400 text-xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                      <p className="text-gray-500 mb-4">Add default categories or create your own custom ones.</p>
                      <div className="space-x-3">
                        <Button
                          onClick={() => seedCategoriesMutation.mutate()}
                          disabled={seedCategoriesMutation.isPending}
                          variant="outline"
                        >
                          Add Default Categories
                        </Button>
                        <Button
                          onClick={() => setIsAddingCategory(true)}
                          className="btn-primary"
                        >
                          Create Custom Category
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Application Information */}
          <Card>
            <CardHeader>
              <CardTitle>About SendWise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-wallet text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">SendWise</h3>
                    <p className="text-sm text-gray-500">Collaborative Financial Management Platform</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Version</p>
                    <p className="text-lg font-semibold text-gray-900">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-lg font-semibold text-gray-900">August 2025</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Support</p>
                    <p className="text-lg font-semibold text-gray-900">Available 24/7</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </main>
      </div>

      {/* Profile Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600">Reset Profile</DialogTitle>
            <DialogDescription className="text-gray-600">
              This action will permanently delete all your data including wallets, transactions, 
              budgets, goals, and preferences. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Warning: This will delete everything
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>All wallets and transactions</li>
                      <li>All budgets and spending tracking</li>
                      <li>All financial goals</li>
                      <li>All categories and preferences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmation" className="text-sm font-medium">
                To confirm, type: <code className="bg-gray-100 px-2 py-1 rounded text-red-600">delete-all-data-by-courage</code>
              </Label>
              <Input
                id="confirmation"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="Type the confirmation text exactly..."
                className="mt-2"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setResetConfirmationText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetProfile}
              disabled={
                resetConfirmationText !== 'delete-all-data-by-courage' || 
                resetProfileMutation.isPending
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {resetProfileMutation.isPending ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Resetting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash mr-2"></i>
                  Reset Profile
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
