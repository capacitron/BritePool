'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AuditAction, ResourceType, UserRole } from '@prisma/client';

interface AuditLog {
  id: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  userRole: UserRole;
}

interface AuditLogTableProps {
  logs: AuditLog[];
}

function getActionBadgeColor(action: AuditAction): string {
  if (action.includes('CREATED') || action.includes('APPROVED') || action.includes('SUCCESS')) {
    return 'bg-green-100 text-green-800';
  }
  if (action.includes('DELETED') || action.includes('REJECTED') || action.includes('FAILED')) {
    return 'bg-red-100 text-red-800';
  }
  if (action.includes('UPDATED') || action.includes('CHANGED')) {
    return 'bg-blue-100 text-blue-800';
  }
  return 'bg-slate-100 text-slate-800';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatAction(action: AuditAction): string {
  return action.replace(/_/g, ' ');
}

function formatResourceType(type: ResourceType): string {
  return type.replace(/_/g, ' ');
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-slate-600">No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(log.timestamp)}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{log.user.name}</p>
                  <p className="text-xs text-muted-foreground">{log.userRole.replace(/_/g, ' ')}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getActionBadgeColor(log.action)}>
                  {formatAction(log.action)}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{formatResourceType(log.resourceType)}</p>
                  {log.resourceId && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {log.resourceId.substring(0, 8)}...
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm truncate">{log.description}</p>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {log.ipAddress}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
