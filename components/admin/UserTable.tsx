'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserRole, UserStatus } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UserTableProps {
  users: User[];
  currentUserRole: UserRole;
  onRefresh: () => void;
}

function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'WEB_STEWARD':
      return 'bg-purple-100 text-purple-800';
    case 'BOARD_CHAIR':
      return 'bg-blue-100 text-blue-800';
    case 'COMMITTEE_LEADER':
      return 'bg-green-100 text-green-800';
    case 'CONTENT_MODERATOR':
      return 'bg-yellow-100 text-yellow-800';
    case 'SUPPORT_STAFF':
      return 'bg-gray-100 text-gray-800';
    case 'STEWARD':
      return 'bg-teal-100 text-teal-800';
    case 'PARTNER':
      return 'bg-orange-100 text-orange-800';
    case 'RESIDENT':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function getStatusBadgeColor(status: UserStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800';
    case 'LOCKED':
      return 'bg-yellow-100 text-yellow-800';
    case 'PENDING_VERIFICATION':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function UserTable({ users, currentUserRole, onRefresh }: UserTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const canEdit = ['WEB_STEWARD', 'BOARD_CHAIR'].includes(currentUserRole);
  const canDelete = currentUserRole === 'WEB_STEWARD';

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    setLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUSPENDED' }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to suspend user');
      }
    } catch {
      alert('Failed to suspend user');
    } finally {
      setLoading(null);
    }
  };

  const handleActivate = async (userId: string) => {
    setLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to activate user');
      }
    } catch {
      alert('Failed to activate user');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Login</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(user.status)}>
                    {user.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading === user.id}
                        >
                          {loading === user.id ? '...' : 'Actions'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        {user.status === 'ACTIVE' ? (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleSuspend(user.id)}
                          >
                            Suspend
                          </DropdownMenuItem>
                        ) : user.status === 'SUSPENDED' ? (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => handleActivate(user.id)}
                          >
                            Activate
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
