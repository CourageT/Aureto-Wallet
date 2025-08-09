import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const invitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(['manager', 'contributor', 'viewer']),
  walletId: z.string().min(1, "Please select a wallet"),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWalletId?: string;
}

export default function InviteUserModal({ isOpen, onClose, selectedWalletId }: InviteUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
      walletId: selectedWalletId || '',
    },
  });

  // Update form when selectedWalletId changes
  useEffect(() => {
    if (selectedWalletId) {
      form.setValue('walletId', selectedWalletId);
    }
  }, [selectedWalletId, form]);

  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
  });

  const mutation = useMutation({
    mutationFn: async (data: InvitationFormData) => {
      const response = await apiRequest('POST', `/api/wallets/${data.walletId}/invitations`, {
        email: data.email,
        role: data.role,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation sent successfully",
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
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvitationFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    form.reset({
      email: '',
      role: 'viewer',
      walletId: selectedWalletId || '',
    });
    onClose();
  };

  // Filter wallets where user can invite others (owner or manager)
  const invitableWallets = wallets?.filter((wallet: any) => {
    const userMember = wallet.members?.find((m: any) => m.user);
    return userMember && ['owner', 'manager'].includes(userMember.role);
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
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
                      {invitableWallets.map((wallet: any) => (
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="colleague@example.com" 
                      type="email" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manager">Manager - Can manage transactions and invite users</SelectItem>
                      <SelectItem value="contributor">Contributor - Can add transactions and view data</SelectItem>
                      <SelectItem value="viewer">Viewer - Read-only access to wallet data</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {invitableWallets.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-exclamation-triangle text-yellow-600"></i>
                  <p className="text-sm text-yellow-800">
                    You don't have permission to invite users to any wallets. You need to be an owner or manager.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={mutation.isPending || invitableWallets.length === 0}
              >
                {mutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
