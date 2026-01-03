'use client';

import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

function getRoleBadgeColor(role: string): string {
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
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function TopBar() {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Admin Panel</h2>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <Badge className={`text-xs ${getRoleBadgeColor(user?.role || '')}`}>
                  {formatRole(user?.role || '')}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard">My Dashboard</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/profile">Profile Settings</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
