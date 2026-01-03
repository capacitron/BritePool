import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { hasPermission } from '@/lib/auth-utils';
import type { UserRole } from '@prisma/client';

async function getStats(userRole: UserRole) {
  const [
    totalUsers,
    pendingForumPosts,
    pendingMedia,
    recentAuditLogs,
  ] = await Promise.all([
    hasPermission(userRole, 'viewUsers')
      ? prisma.user.count()
      : null,
    hasPermission(userRole, 'viewModeration')
      ? prisma.forumPost.count({ where: { status: 'PENDING' } })
      : null,
    hasPermission(userRole, 'viewModeration')
      ? prisma.mediaItem.count({ where: { status: 'PENDING' } })
      : null,
    hasPermission(userRole, 'viewAuditLogs')
      ? prisma.auditLog.count({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        })
      : null,
  ]);

  return {
    totalUsers,
    pendingForumPosts,
    pendingMedia,
    recentAuditLogs,
    pendingTotal: (pendingForumPosts || 0) + (pendingMedia || 0),
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const userRole = session?.user?.role as UserRole;
  const stats = await getStats(userRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Overview of your administrative area</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.totalUsers !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Registered members
              </p>
            </CardContent>
          </Card>
        )}

        {stats.pendingTotal > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardDescription>Pending Moderation</CardDescription>
              <CardTitle className="text-3xl text-yellow-700">
                {stats.pendingTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-600">
                {stats.pendingForumPosts} posts, {stats.pendingMedia} media
              </p>
            </CardContent>
          </Card>
        )}

        {stats.pendingTotal === 0 && hasPermission(userRole, 'viewModeration') && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardDescription>Moderation Queue</CardDescription>
              <CardTitle className="text-3xl text-green-700">Clear</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-600">
                No items pending review
              </p>
            </CardContent>
          </Card>
        )}

        {stats.recentAuditLogs !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recent Activity</CardDescription>
              <CardTitle className="text-3xl">{stats.recentAuditLogs}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Actions in last 24 hours
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {hasPermission(userRole, 'createUsers') && (
              <a
                href="/dashboard/admin/users?action=create"
                className="flex items-center p-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Create New User</p>
                  <p className="text-sm text-slate-500">Add a new member to the platform</p>
                </div>
              </a>
            )}
            {hasPermission(userRole, 'viewModeration') && (
              <a
                href="/dashboard/admin/moderation"
                className="flex items-center p-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Review Content</p>
                  <p className="text-sm text-slate-500">Moderate pending submissions</p>
                </div>
              </a>
            )}
            {hasPermission(userRole, 'viewAuditLogs') && (
              <a
                href="/dashboard/admin/audit"
                className="flex items-center p-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">View Audit Logs</p>
                  <p className="text-sm text-slate-500">Track administrative activity</p>
                </div>
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Permissions</CardTitle>
            <CardDescription>Based on your role: {userRole?.replace(/_/g, ' ')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {hasPermission(userRole, 'viewUsers') && (
                <li className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  View users
                </li>
              )}
              {hasPermission(userRole, 'createUsers') && (
                <li className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Create and edit users
                </li>
              )}
              {hasPermission(userRole, 'approveContent') && (
                <li className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Moderate content
                </li>
              )}
              {hasPermission(userRole, 'viewAuditLogs') && (
                <li className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  View audit logs
                </li>
              )}
              {hasPermission(userRole, 'editSettings') && (
                <li className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Manage system settings
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
