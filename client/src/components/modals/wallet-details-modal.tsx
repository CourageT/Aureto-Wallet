import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Users, Mail, UserPlus, Settings, Trash2, Crown, Shield, Edit, Eye } from 'lucide-react';

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  description?: string;
  _count?: {
    transactions: number;
    members: number;
  };
}

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
}

interface WalletMember {
  id: string;
  role: 'owner' | 'manager' | 'contributor' | 'viewer';
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface WalletInvitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const ROLE_ICONS = {
  owner: Crown,
  manager: Shield,
  contributor: Edit,
  viewer: Eye,
};

const ROLE_COLORS = {
  owner: 'bg-yellow-100 text-yellow-800',
  manager: 'bg-blue-100 text-blue-800',
  contributor: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

export default function WalletDetailsModal({ isOpen, onClose, walletId }: WalletDetailsModalProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'contributor' | 'viewer'>('contributor');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading } = useQuery<Wallet>({
    queryKey: ['/api/wallets', walletId],
    enabled: isOpen && !!walletId,
  });

  const { data: members = [] } = useQuery<WalletMember[]>({
    queryKey: ['/api/wallets', walletId, 'members'],
    enabled: isOpen && !!walletId,
  });

  const { data: invitations = [] } = useQuery<WalletInvitation[]>({
    queryKey: ['/api/wallets', walletId, 'invitations'],
    enabled: isOpen && !!walletId,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const response = await apiRequest(`/api/wallets/${walletId}/invitations`, 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets', walletId, 'invitations'] });
      setInviteEmail('');
      setInviteRole('contributor');
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
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { memberId: string; role: string }) => {
      const response = await apiRequest(`/api/wallets/${walletId}/members/${data.memberId}`, 'PUT', {
        role: data.role,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets', walletId, 'members'] });
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
        description: "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest(`/api/wallets/${walletId}/members/${memberId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets', walletId, 'members'] });
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
        description: "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateRoleMutation.mutate({ memberId, role: newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!wallet) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Wallet: {wallet.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wallet Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <Badge variant="outline" className="capitalize">
                  {wallet.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Balance:</span>
                <span className="font-medium">${wallet.balance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transactions:</span>
                <span className="font-medium">{wallet._count?.transactions || 0}</span>
              </div>
              {wallet.description && (
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="text-sm mt-1">{wallet.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role];
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {member.user.profileImageUrl ? (
                          <img
                            src={member.user.profileImageUrl}
                            alt={member.user.email}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {member.user.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {member.user.firstName && member.user.lastName 
                              ? `${member.user.firstName} ${member.user.lastName}`
                              : member.user.email
                            }
                          </p>
                          {member.user.firstName && member.user.lastName && (
                            <p className="text-sm text-gray-600">{member.user.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={ROLE_COLORS[member.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {member.role}
                        </Badge>
                        
                        {member.role !== 'owner' && (
                          <div className="flex gap-1">
                            <Select
                              value={member.role}
                              onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-auto h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="contributor">Contributor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={removeMemberMutation.isPending}
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Invite Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5" />
                Invite Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager - Full access except deleting wallet</SelectItem>
                      <SelectItem value="contributor">Contributor - Can add/edit transactions</SelectItem>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" disabled={inviteMutation.isPending} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  {inviteMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Pending Invitations ({invitations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-gray-600">
                          Invited as {invitation.role} • {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={`capitalize ${
                        invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invitation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}