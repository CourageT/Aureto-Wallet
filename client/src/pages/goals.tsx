import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import MobileNavigation from '@/components/layout/mobile-navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Target, Plus, DollarSign, Calendar, TrendingUp, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: string;
  currentAmount: string;
  targetDate?: string;
  category: string;
  priority: string;
  isActive: boolean;
  achievedAt?: string;
  createdAt: string;
}

export default function Goals() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['/api/goals'],
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: Partial<Goal>) => {
      const response = await apiRequest('POST', '/api/goals', goalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Goal creation error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  const contributeMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: string }) => {
      const response = await apiRequest('POST', `/api/goals/${goalId}/contribute`, { amount });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contribution added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setSelectedGoal(null);
      setContributionAmount('');
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add contribution",
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await apiRequest('DELETE', `/api/goals/${goalId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setGoalToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Goal deletion error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<Goal> }) => {
      const response = await apiRequest('PATCH', `/api/goals/${goalId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setIsEditDialogOpen(false);
      setSelectedGoal(null);
    },
    onError: (error: Error) => {
      console.error('Goal update error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update goal",
        variant: "destructive",
      });
    },
  });

  const handleCreateGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const goalData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      targetAmount: formData.get('targetAmount') as string,
      targetDate: formData.get('targetDate') ? formData.get('targetDate') as string : null,
      category: formData.get('category') as string || 'savings',
      priority: formData.get('priority') as string || 'medium',
    };

    console.log('Creating goal with data:', goalData);
    createGoalMutation.mutate(goalData);
  };

  const handleEditGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGoal) return;
    
    const formData = new FormData(e.currentTarget);
    
    const updates = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      targetAmount: formData.get('targetAmount') as string,
      targetDate: formData.get('targetDate') ? formData.get('targetDate') as string : null,
      category: formData.get('category') as string || 'savings',
      priority: formData.get('priority') as string || 'medium',
    };

    console.log('Updating goal with data:', updates);
    updateGoalMutation.mutate({ goalId: selectedGoal.id, updates });
  };

  const handleDeleteGoal = () => {
    if (!goalToDelete) return;
    deleteGoalMutation.mutate(goalToDelete.id);
  };

  const handleContribute = () => {
    if (!selectedGoal || !contributionAmount) return;
    
    contributeMutation.mutate({
      goalId: selectedGoal.id,
      amount: contributionAmount,
    });
  };

  const calculateProgress = (current: string, target: string): number => {
    const currentAmount = parseFloat(current);
    const targetAmount = parseFloat(target);
    return targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Financial Goals</h1>
        </div>
        <div className="text-center py-8">Loading goals...</div>
      </div>
    );
  }

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
            <TopBar title="Goals" subtitle="Track your progress towards financial milestones" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold">Financial Goals</h1>
                <p className="text-muted-foreground">Track your progress towards financial milestones</p>
              </div>
        
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <Label htmlFor="name">Goal Name</Label>
                <Input id="name" name="name" placeholder="Emergency Fund" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="6 months of expenses" />
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input id="targetAmount" name="targetAmount" type="number" placeholder="10000" required />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select id="category" name="category" className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="vacation">Vacation</option>
                  <option value="house">House Down Payment</option>
                  <option value="car">Car Purchase</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select id="priority" name="priority" className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createGoalMutation.isPending}>
                  {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Goal Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditGoal} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Goal Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  placeholder="Emergency Fund" 
                  defaultValue={selectedGoal?.name}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input 
                  id="edit-description" 
                  name="description" 
                  placeholder="6 months of expenses" 
                  defaultValue={selectedGoal?.description}
                />
              </div>
              <div>
                <Label htmlFor="edit-targetAmount">Target Amount</Label>
                <Input 
                  id="edit-targetAmount" 
                  name="targetAmount" 
                  type="number" 
                  placeholder="10000" 
                  defaultValue={selectedGoal?.targetAmount}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-targetDate">Target Date</Label>
                <Input 
                  id="edit-targetDate" 
                  name="targetDate" 
                  type="date"
                  defaultValue={selectedGoal?.targetDate ? selectedGoal.targetDate.split('T')[0] : ''}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <select 
                  id="edit-category" 
                  name="category" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={selectedGoal?.category}
                >
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="vacation">Vacation</option>
                  <option value="house">House Down Payment</option>
                  <option value="car">Car Purchase</option>
                  <option value="education">Education</option>
                  <option value="savings">Savings</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <select 
                  id="edit-priority" 
                  name="priority" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={selectedGoal?.priority}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedGoal(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateGoalMutation.isPending}>
                  {updateGoalMutation.isPending ? 'Updating...' : 'Update Goal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Goal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{goalToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGoal}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteGoalMutation.isPending}
              >
                {deleteGoalMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
            </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first financial goal to track your progress
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal: Goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const isAchieved = goal.achievedAt || progress >= 100;
            
            return (
              <Card key={goal.id} className={`${isAchieved ? 'border-green-200 bg-green-50/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className={`h-5 w-5 ${isAchieved ? 'text-green-600' : 'text-blue-600'}`} />
                        {goal.name}
                        {isAchieved && <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Achieved</span>}
                      </CardTitle>
                      {goal.description && (
                        <CardDescription className="mt-1">{goal.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Priority</div>
                        <div className={`text-sm font-medium ${
                          goal.priority === 'high' ? 'text-red-600' :
                          goal.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedGoal(goal);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Goal
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setGoalToDelete(goal)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Current</div>
                      <div className="font-semibold text-green-600">
                        ${parseFloat(goal.currentAmount).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target</div>
                      <div className="font-semibold">
                        ${parseFloat(goal.targetAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {goal.targetDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Target: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                    </div>
                  )}

                  {!isAchieved && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Add Contribution
                    </Button>
                  )}

                  {isAchieved && goal.achievedAt && (
                    <div className="text-sm text-green-600 text-center">
                      🎉 Achieved on {format(new Date(goal.achievedAt), 'MMM dd, yyyy')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contribution Dialog */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedGoal.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Current: ${parseFloat(selectedGoal.currentAmount).toLocaleString()} / 
                  Target: ${parseFloat(selectedGoal.targetAmount).toLocaleString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="contribution">Contribution Amount</Label>
                <Input
                  id="contribution"
                  type="number"
                  placeholder="100"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedGoal(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleContribute} 
                  disabled={contributeMutation.isPending || !contributionAmount}
                >
                  {contributeMutation.isPending ? 'Adding...' : 'Add Contribution'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </>
  );
}