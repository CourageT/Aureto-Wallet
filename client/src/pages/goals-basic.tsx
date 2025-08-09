import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import MobileNavigation from '@/components/layout/mobile-navigation';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

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
      setShowCreateForm(false);
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
            <div className="text-center py-8">Loading goals...</div>
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
            <TopBar title="Goals" subtitle="Track your progress towards financial milestones" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold">Financial Goals</h1>
                <p className="text-muted-foreground">Track your progress towards financial milestones</p>
              </div>
              
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                + Create Goal
              </button>
            </div>

            {showCreateForm && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Create New Goal</h3>
                </div>
                <div className="p-6 pt-0">
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Goal Name</label>
                      <input 
                        name="name" 
                        placeholder="Emergency Fund" 
                        required 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                      <input 
                        name="description" 
                        placeholder="6 months of expenses"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Target Amount</label>
                      <input 
                        name="targetAmount" 
                        type="number" 
                        placeholder="10000" 
                        required 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Target Date</label>
                      <input 
                        name="targetDate" 
                        type="date" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateForm(false)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={createGoalMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {goals.length === 0 ? (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 text-center py-12">
                  <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">🎯</div>
                  <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your first financial goal to track your progress
                  </p>
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    + Create Your First Goal
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal: Goal) => {
                  const current = parseFloat(goal.currentAmount);
                  const target = parseFloat(goal.targetAmount);
                  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                  
                  return (
                    <div key={goal.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="flex items-start justify-between">
                          <h3 className="text-2xl font-semibold leading-none tracking-tight">{goal.name}</h3>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                      <div className="p-6 pt-0 space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Current</div>
                            <div className="font-semibold text-green-600">
                              ${current.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Target</div>
                            <div className="font-semibold">
                              ${target.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Priority: </span>
                          <span className={`font-medium ${
                            goal.priority === 'high' ? 'text-red-600' :
                            goal.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}