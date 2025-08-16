import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePWA } from "@/hooks/usePWA";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  username: z.string().optional(),
});

const preferencesSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  theme: z.enum(["light", "dark", "auto"]),
});

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;
type CategoryFormData = z.infer<typeof categorySchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const { isInstalled, isInstallable, installApp } = usePWA();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || '',
    },
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
      theme: 'light',
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'fas fa-tag',
      color: '#3B82F6',
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle the redirect
  }

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users/me"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest('/api/users/me', 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });

        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormData) => {
      const response = await apiRequest('/api/users/me/preferences', 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });

        return;
      }
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest('/api/categories', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      categoryForm.reset();
      setIsAddingCategory(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });

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
      const response = await apiRequest('/api/seed-categories', 'POST', {});
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
      const response = await apiRequest('/api/users/me/reset', 'POST', {
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

  const handleInstallApp = async () => {
    const success = await installApp();
    if (success) {
      toast({
        title: "App Installed!",
        description: "Aureto Wallet has been installed on your device.",
      });
    } else {
      toast({
        title: "Installation Failed",
        description: "Unable to install the app. Try again later.",
        variant: "destructive",
      });
    }
  };

  const onSubmitProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPreferences = (data: PreferencesFormData) => {
    updatePreferencesMutation.mutate(data);
  };

  const onSubmitCategory = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const userCategories = Array.isArray(categories) ? categories.filter((cat: any) => !cat.isDefault) : [];
  const defaultCategories = Array.isArray(categories) ? categories.filter((cat: any) => cat.isDefault) : [];

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
            <TopBar title="Manage Profile" subtitle="Manage your account, preferences, and settings" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6">
            {/* Profile Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-6">
                <img
                  src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || user.email)}&background=3B82F6&color=fff`}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                  </h1>
                  <p className="text-lg text-gray-600">Account Owner</p>
                  <Badge variant="outline" className="mt-2">
                    <i className="fas fa-crown text-yellow-500 mr-2"></i>
                    Premium Account
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your first name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="btn-primary"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>App Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...preferencesForm}>
                      <form onSubmit={preferencesForm.handleSubmit(onSubmitPreferences)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={preferencesForm.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={preferencesForm.control}
                            name="timezone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timezone</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                    <SelectItem value="Europe/London">London</SelectItem>
                                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={preferencesForm.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="ja">Japanese</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={preferencesForm.control}
                            name="theme"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Theme</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="auto">Auto</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="btn-primary"
                          disabled={updatePreferencesMutation.isPending}
                        >
                          {updatePreferencesMutation.isPending ? 'Updating...' : 'Update Preferences'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-6">
                {/* Create Category */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Manage Categories</CardTitle>
                      <Button
                        onClick={() => setIsAddingCategory(true)}
                        className="btn-primary"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Add Category
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!Array.isArray(categories) || categories.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-tags text-gray-400 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                        <p className="text-gray-500 mb-4">Add default categories to get started.</p>
                        <Button
                          onClick={() => seedCategoriesMutation.mutate()}
                          disabled={seedCategoriesMutation.isPending}
                          className="btn-primary"
                        >
                          {seedCategoriesMutation.isPending ? 'Adding...' : 'Add Default Categories'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Default Categories */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Default Categories</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {defaultCategories.map((category: any) => (
                              <div key={category.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: category.color }}>
                                  <i className={`${category.icon} text-white text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{category.name}</p>
                                  <p className="text-xs text-gray-500 capitalize">{category.type}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Custom Categories */}
                        {userCategories.length > 0 && (
                          <div>
                            <Separator />
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Your Categories</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {userCategories.map((category: any) => (
                                <div key={category.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: category.color }}>
                                    <i className={`${category.icon} text-white text-sm`}></i>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{category.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{category.type}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                {/* Install App Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-mobile-alt text-blue-600 mr-2"></i>
                      Install App
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <img src="/aureto-logo.png" alt="Aureto Wallet Logo" className="w-8 h-8 object-contain" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Install Aureto Wallet
                          </h3>
                          {isInstalled ? (
                            <div className="flex items-center space-x-2 text-green-600 mb-2">
                              <i className="fas fa-check-circle"></i>
                              <span className="text-sm font-medium">App is already installed</span>
                            </div>
                          ) : isInstallable ? (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 mb-3">
                                Install Aureto Wallet as a native app for quick access, offline functionality, and a better user experience.
                              </p>
                              <Button
                                onClick={handleInstallApp}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                data-testid="install-app-button"
                              >
                                <i className="fas fa-download mr-2"></i>
                                Install App
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 mb-2">
                              <p>App installation is not available in this browser or the app is already installed.</p>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>• Works offline after installation</p>
                            <p>• Fast loading and native app experience</p>
                            <p>• Add to home screen and dock</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <h4 className="text-lg font-medium text-red-800 mb-2">Reset Profile</h4>
                        <p className="text-sm text-red-700 mb-4">
                          This will permanently delete all your data including wallets, transactions, budgets, and preferences. This action cannot be undone.
                        </p>
                        <Button
                          onClick={() => setShowResetDialog(true)}
                          variant="destructive"
                        >
                          <i className="fas fa-exclamation-triangle mr-2"></i>
                          Reset Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter category description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={categoryForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input placeholder="fas fa-tag" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingCategory(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reset Profile Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Reset Profile</DialogTitle>
            <DialogDescription>
              This action will permanently delete all your data including wallets, transactions, budgets, and preferences.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                To confirm this action, type <strong>delete-all-data-by-courage</strong> in the box below:
              </p>
            </div>
            <Input
              value={resetConfirmationText}
              onChange={(e) => setResetConfirmationText(e.target.value)}
              placeholder="Type: delete-all-data-by-courage"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetProfile}
              disabled={resetConfirmationText !== 'delete-all-data-by-courage' || resetProfileMutation.isPending}
            >
              {resetProfileMutation.isPending ? 'Resetting...' : 'Reset Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}