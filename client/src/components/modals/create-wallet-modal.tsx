import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const walletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(255, "Name too long"),
  description: z.string().optional(),
  type: z.enum(['personal', 'shared', 'savings_goal']),
  currency: z.string().default('USD'),
  goalAmount: z.string().optional().refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), "Goal amount must be a positive number"),
  goalDate: z.string().optional(),
});

type WalletFormData = z.infer<typeof walletSchema>;

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateWalletModal({ isOpen, onClose }: CreateWalletModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'personal',
      currency: 'USD',
      goalAmount: '',
      goalDate: '',
    },
  });

  const watchedType = form.watch('type');

  const mutation = useMutation({
    mutationFn: async (data: WalletFormData) => {
      const walletData: any = {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        currency: data.currency,
      };

      if (data.type === 'savings_goal') {
        if (data.goalAmount) {
          walletData.goalAmount = parseFloat(data.goalAmount);
        }
        if (data.goalDate) {
          walletData.goalDate = new Date(data.goalDate).toISOString();
        }
      }

      const response = await apiRequest('/api/wallets', 'POST', walletData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wallet created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      form.reset();
      onClose();
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
        description: "Failed to create wallet",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WalletFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Wallet</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Household Expenses" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wallet type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">Personal Wallet</SelectItem>
                      <SelectItem value="shared">Shared Wallet</SelectItem>
                      <SelectItem value="savings_goal">Savings Goal</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea 
                      placeholder="Brief description of this wallet..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {watchedType === 'savings_goal' && (
              <>
                <FormField
                  control={form.control}
                  name="goalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Amount</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0.00" 
                          type="number" 
                          step="0.01" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="goalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create Wallet"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
