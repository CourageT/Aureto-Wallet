import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import InviteUserModal from "@/components/modals/invite-user-modal";

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'owner': return 'badge-success';
    case 'manager': return 'badge-primary';
    case 'contributor': return 'badge-secondary';
    case 'viewer': return 'badge-secondary';
    default: return 'badge-secondary';
  }
};

export default function TeamManagement() {
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  
  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
  });

  // Get all unique team members across all wallets
  const allMembers = Array.isArray(wallets) ? wallets.reduce((acc: any[], wallet: any) => {
    if (Array.isArray(wallet.members)) {
      wallet.members.forEach((member: any) => {
        if (!acc.find(m => m.user.id === member.user.id)) {
          acc.push(member);
        }
      });
    }
    return acc;
  }, []) : [];

  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Team Members</CardTitle>
            <Button
              onClick={() => setIsInviteUserOpen(true)}
              className="btn-primary px-4 py-2"
            >
              <i className="fas fa-user-plus text-sm mr-2"></i>
              Invite Member
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {allMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-gray-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500 mb-4">Invite people to collaborate on your wallets.</p>
              <Button
                onClick={() => setIsInviteUserOpen(true)}
                className="btn-primary"
              >
                <i className="fas fa-user-plus text-sm mr-2"></i>
                Invite Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allMembers.map((member: any) => (
                <div key={member.user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={member.user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.firstName || member.user.email)}&background=3B82F6&color=fff`}
                      alt="Team member avatar"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.firstName ? `${member.user.firstName} ${member.user.lastName || ''}`.trim() : member.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`${getRoleBadge(member.role)} capitalize`}>
                      {member.role}
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-gray-600">
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-red-600">
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteUserModal
        isOpen={isInviteUserOpen}
        onClose={() => setIsInviteUserOpen(false)}
      />
    </>
  );
}
