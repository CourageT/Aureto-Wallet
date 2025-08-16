import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InviteUserModal from "@/components/modals/invite-user-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'owner': return 'bg-success-100 text-success-800';
    case 'manager': return 'bg-primary-100 text-primary-800';
    case 'contributor': return 'bg-blue-100 text-blue-800';
    case 'viewer': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'owner': return 'Full administrative control';
    case 'manager': return 'Can manage transactions and invite users';
    case 'contributor': return 'Can add transactions and view data';
    case 'viewer': return 'Read-only access to wallet data';
    default: return 'Unknown role';
  }
};

export default function Team() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle the redirect
  }

  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
  });

  // Set default wallet when wallets load
  useEffect(() => {
    if (wallets?.length && !selectedWallet) {
      setSelectedWallet(wallets[0].id);
    }
  }, [wallets, selectedWallet]);

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/wallets", selectedWallet, "members"],
    enabled: isAuthenticated && !!selectedWallet,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest(`/api/wallets/${selectedWallet}/members/${userId}/role`, 'PUT', { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets", selectedWallet, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
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
        description: "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest(`/api/wallets/${selectedWallet}/members/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets", selectedWallet, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
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
        description: "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading team management...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedWalletData = wallets?.find((w: any) => w.id === selectedWallet);
  const currentUserMember = members?.find((m: any) => m.userId === user?.id);
  const canManageMembers = currentUserMember && ['owner', 'manager'].includes(currentUserMember.role);

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
            <TopBar title="Team Management" subtitle="Manage wallet members and their permissions" />
          </div>
          
          <div className="p-4 md:p-6 pt-20 md:pt-6 pb-24 md:pb-6 space-y-6">
            {/* Wallet Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
                    <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets?.map((wallet: any) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name} ({wallet.members?.length || 0} members)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {canManageMembers && (
                    <Button
                      onClick={() => setIsInviteUserOpen(true)}
                      className="btn-primary"
                      disabled={!selectedWallet}
                    >
                      <i className="fas fa-user-plus text-sm mr-2"></i>
                      Invite Member
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {!selectedWallet ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-users text-gray-400 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a wallet</h3>
                  <p className="text-gray-500">Choose a wallet to view and manage its team members.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Wallet Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Wallet Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Wallet Name</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedWalletData?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Type</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {selectedWalletData?.type?.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Your Role</p>
                        <Badge className={getRoleBadge(currentUserMember?.role || 'viewer')}>
                          {currentUserMember?.role || 'Viewer'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Team Members ({members?.length || 0})</CardTitle>
                      {canManageMembers && (
                        <Button
                          onClick={() => setIsInviteUserOpen(true)}
                          className="btn-primary"
                        >
                          <i className="fas fa-user-plus text-sm mr-2"></i>
                          Invite Member
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {membersLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                              <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                          </div>
                        ))}
                      </div>
                    ) : !members || members.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-users text-gray-400 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                        <p className="text-gray-500 mb-4">This wallet doesn't have any team members yet.</p>
                        {canManageMembers && (
                          <Button
                            onClick={() => setIsInviteUserOpen(true)}
                            className="btn-primary"
                          >
                            <i className="fas fa-user-plus text-sm mr-2"></i>
                            Invite First Member
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {members.map((member: any) => {
                          const isCurrentUser = member.userId === user?.id;
                          const canEditThisMember = canManageMembers && !isCurrentUser;
                          
                          return (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-4 flex-1">
                                <img
                                  src={member.user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.firstName || member.user.email)}&background=3B82F6&color=fff`}
                                  alt="Team member avatar"
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-gray-900">
                                      {member.user.firstName ? `${member.user.firstName} ${member.user.lastName || ''}`.trim() : member.user.email}
                                    </p>
                                    {isCurrentUser && (
                                      <Badge variant="outline" className="text-xs">You</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">{member.user.email}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {getRoleDescription(member.role)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                {canEditThisMember ? (
                                  <Select
                                    value={member.role}
                                    onValueChange={(newRole) => updateRoleMutation.mutate({ userId: member.userId, role: newRole })}
                                    disabled={updateRoleMutation.isPending}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="owner">Owner</SelectItem>
                                      <SelectItem value="manager">Manager</SelectItem>
                                      <SelectItem value="contributor">Contributor</SelectItem>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge className={getRoleBadge(member.role)}>
                                    {member.role}
                                  </Badge>
                                )}
                                
                                {canEditThisMember && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 text-gray-400 hover:text-red-600"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove ${member.user.firstName || member.user.email} from this wallet?`)) {
                                        removeMemberMutation.mutate(member.userId);
                                      }
                                    }}
                                    disabled={removeMemberMutation.isPending}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Role Descriptions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-success-100 text-success-800 mt-1">Owner</Badge>
                          <div>
                            <p className="font-medium text-gray-900">Full Control</p>
                            <p className="text-sm text-gray-500">Can delete wallet, manage all permissions, and perform all actions.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-primary-100 text-primary-800 mt-1">Manager</Badge>
                          <div>
                            <p className="font-medium text-gray-900">Administrative Access</p>
                            <p className="text-sm text-gray-500">Can add/edit transactions, invite users, modify categories and budgets.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-blue-100 text-blue-800 mt-1">Contributor</Badge>
                          <div>
                            <p className="font-medium text-gray-900">Transaction Access</p>
                            <p className="text-sm text-gray-500">Can add transactions and view full wallet data.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-gray-100 text-gray-800 mt-1">Viewer</Badge>
                          <div>
                            <p className="font-medium text-gray-900">Read-Only Access</p>
                            <p className="text-sm text-gray-500">Can view transactions and reports but cannot make changes.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>

      <InviteUserModal
        isOpen={isInviteUserOpen}
        onClose={() => setIsInviteUserOpen(false)}
        selectedWalletId={selectedWallet}
      />
    </>
  );
}
