import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import MobileNavigation from '@/components/layout/mobile-navigation';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Plus, Target, TrendingUp, Edit, Trash2, DollarSign } from 'lucide-react';

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
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
      setShowCreateForm(false);
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
        description: error.message || "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  const contributeToGoalMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const response = await apiRequest('POST', `/api/goals/${goalId}/contribute`, { amount });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contribution added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setShowContributeForm(null);
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
        description: error.message || "Failed to add contribution",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, goalData }: { goalId: string; goalData: Partial<Goal> }) => {
      const response = await apiRequest('PUT', `/api/goals/${goalId}`, goalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setShowEditForm(false);
      setSelectedGoal(null);
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
        description: error.message || "Failed to update goal",
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
        description: error.message || "Failed to delete goal",
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
      targetDate: formData.get('targetDate') ? formData.get('targetDate') as string : undefined,
      category: formData.get('category') as string || 'savings',
      priority: formData.get('priority') as string || 'medium',
    };

    createGoalMutation.mutate(goalData);
  };

  const handleContribute = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    
    if (showContributeForm && amount > 0) {
      contributeToGoalMutation.mutate({ goalId: showContributeForm, amount });
    }
  };

  const handleEditGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedGoal) return;

    const goalData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      targetAmount: formData.get('targetAmount') as string,
      targetDate: formData.get('targetDate') ? formData.get('targetDate') as string : undefined,
      category: formData.get('category') as string || 'savings',
      priority: formData.get('priority') as string || 'medium',
    };

    updateGoalMutation.mutate({ goalId: selectedGoal.id, goalData });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto">
          <div className="hidden md:block">
            <TopBar title="Goals" subtitle="Track your progress towards financial milestones" />
          </div>
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  {/* Goal header skeleton */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>

                  {/* Description skeleton */}
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  
                  {/* Progress bar skeleton */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3"></div>
                  </div>

                  {/* Financial details skeleton */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>

                  {/* Remaining amount skeleton */}
                  <div className="mb-4">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>

                  {/* Action buttons skeleton */}
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-9 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
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
            <TopBar 
              title="Goals" 
              subtitle="Track your progress towards financial milestones"
              showAddTransaction={true}
            />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
            {/* Mobile Header with Action Buttons */}
            <div className="md:hidden flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Goals</h1>
                <p className="text-sm text-muted-foreground">Track your financial milestones</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.location.href = '/transactions?action=add'}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-9 px-3 py-2"
                >
                  <Plus size={16} />
                  Add Transaction
                </button>
                <button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2"
                >
                  <Target size={16} />
                  New Goal
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Financial Goals</h1>
                <p className="text-muted-foreground">Track your progress towards financial milestones</p>
              </div>
              
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Target size={20} />
                Create Goal
              </button>
            </div>

            {/* Create Goal Form */}
            {showCreateForm && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Create New Goal
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium leading-none">Goal Name</label>
                        <input 
                          name="name" 
                          placeholder="Emergency Fund" 
                          required 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none">Category</label>
                        <select 
                          name="category" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="emergency">Emergency Fund</option>
                          <option value="vacation">Vacation</option>
                          <option value="house">House/Property</option>
                          <option value="car">Vehicle</option>
                          <option value="education">Education</option>
                          <option value="retirement">Retirement</option>
                          <option value="debt">Debt Payoff</option>
                          <option value="savings">General Savings</option>
                          <option value="investment">Investment</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium leading-none">Description</label>
                      <input 
                        name="description" 
                        placeholder="Save for 6 months of expenses"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium leading-none">Target Amount ($)</label>
                        <input 
                          name="targetAmount" 
                          type="number" 
                          step="0.01"
                          placeholder="10000" 
                          required 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none">Target Date</label>
                        <input 
                          name="targetDate" 
                          type="date" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none">Priority</label>
                        <select 
                          name="priority" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateForm(false)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={createGoalMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Goals Grid */}
            {goals.length === 0 ? (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 text-center py-12">
                  <Target className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start your financial journey by setting your first goal. Whether it's an emergency fund, vacation, or dream purchase - every big achievement starts with a goal.
                  </p>
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    <Target size={20} />
                    Create Your First Goal
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal: Goal) => {
                  const current = parseFloat(goal.currentAmount);
                  const target = parseFloat(goal.targetAmount);
                  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                  const remaining = Math.max(target - current, 0);
                  
                  return (
                    <div key={goal.id} className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
                              {goal.category === 'emergency' && '🚨'}
                              {goal.category === 'vacation' && '✈️'}
                              {goal.category === 'house' && '🏠'}
                              {goal.category === 'car' && '🚗'}
                              {goal.category === 'education' && '🎓'}
                              {goal.category === 'retirement' && '🏖️'}
                              {goal.category === 'debt' && '💳'}
                              {goal.category === 'investment' && '📈'}
                              {(!goal.category || goal.category === 'savings' || goal.category === 'other') && '💰'}
                              {goal.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                                goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedGoal(goal);
                                setShowEditForm(true);
                              }}
                              className="p-2 hover:bg-muted rounded-md"
                              title="Edit goal"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this goal?')) {
                                  deleteGoalMutation.mutate(goal.id);
                                }
                              }}
                              className="p-2 hover:bg-muted rounded-md text-red-500"
                              title="Delete goal"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                      
                      <div className="p-6 pt-0 space-y-4">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                progress >= 100 ? 'bg-green-600' : 
                                progress >= 75 ? 'bg-blue-600' : 
                                progress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Financial Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Saved</div>
                            <div className="font-semibold text-green-600 text-lg">
                              ${current.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Target</div>
                            <div className="font-semibold text-lg">
                              ${target.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm">
                          <div className="text-muted-foreground">Remaining</div>
                          <div className="font-semibold text-orange-600 text-lg">
                            ${remaining.toLocaleString()}
                          </div>
                        </div>

                        {goal.targetDate && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Target Date: </span>
                            <span className="font-medium">{formatDate(goal.targetDate)}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setShowContributeForm(goal.id)}
                            className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-9 px-3 py-2"
                          >
                            <DollarSign size={16} />
                            Add Money
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGoal(goal);
                              setShowEditForm(true);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                        </div>

                        {progress >= 100 && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                            <div className="text-green-800 font-semibold text-sm">
                              🎉 Goal Achieved! Congratulations!
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contribute Form Modal */}
            {showContributeForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Add Money to Goal
                    </h3>
                    <form onSubmit={handleContribute}>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Amount ($)</label>
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            placeholder="100.00"
                            required
                            min="0.01"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowContributeForm(null)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={contributeToGoalMutation.isPending}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2"
                          >
                            {contributeToGoalMutation.isPending ? 'Adding...' : 'Add Money'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Goal Form Modal */}
            {showEditForm && selectedGoal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Edit Goal
                    </h3>
                    <form onSubmit={handleEditGoal}>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Goal Name</label>
                            <input
                              name="name"
                              defaultValue={selectedGoal.name}
                              required
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Category</label>
                            <select
                              name="category"
                              defaultValue={selectedGoal.category}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="emergency">Emergency Fund</option>
                              <option value="vacation">Vacation</option>
                              <option value="house">House/Property</option>
                              <option value="car">Vehicle</option>
                              <option value="education">Education</option>
                              <option value="retirement">Retirement</option>
                              <option value="debt">Debt Payoff</option>
                              <option value="savings">General Savings</option>
                              <option value="investment">Investment</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <input
                            name="description"
                            defaultValue={selectedGoal.description || ''}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium">Target Amount ($)</label>
                            <input
                              name="targetAmount"
                              type="number"
                              step="0.01"
                              defaultValue={selectedGoal.targetAmount}
                              required
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Target Date</label>
                            <input
                              name="targetDate"
                              type="date"
                              defaultValue={selectedGoal.targetDate ? selectedGoal.targetDate.split('T')[0] : ''}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Priority</label>
                            <select
                              name="priority"
                              defaultValue={selectedGoal.priority}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="high">High Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="low">Low Priority</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowEditForm(false);
                              setSelectedGoal(null);
                            }}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={updateGoalMutation.isPending}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                          >
                            {updateGoalMutation.isPending ? 'Updating...' : 'Update Goal'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}