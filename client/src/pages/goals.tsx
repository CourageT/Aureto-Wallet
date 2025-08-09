import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Target, Plus, DollarSign, Calendar, TrendingUp } from 'lucide-react';
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
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
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
        description: "Failed to create goal",
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

  const handleCreateGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createGoalMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      targetAmount: formData.get('targetAmount') as string,
      targetDate: formData.get('targetDate') as string,
      category: formData.get('category') as string,
      priority: formData.get('priority') as string,
    });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
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
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Priority</div>
                      <div className={`text-sm font-medium ${
                        goal.priority === 'high' ? 'text-red-600' :
                        goal.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                      </div>
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
  );
}