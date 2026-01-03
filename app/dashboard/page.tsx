import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isAdminRole } from '@/lib/auth-utils';
import type { UserRole } from '@prisma/client';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;
  const isAdmin = isAdminRole(userRole);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-serif font-bold text-slate-900">BRITE POOL</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/admin">Admin Panel</Link>
                </Button>
              )}
              <span className="text-sm text-slate-600">
                Welcome, {session.user.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Welcome to your BRITE POOL dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Update your personal information and preferences.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Committees</CardTitle>
              <CardDescription>Your committee memberships</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                View and participate in your assigned committees.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Center</CardTitle>
              <CardDescription>Courses and educational content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Access courses and track your learning progress.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-900">Admin Access</CardTitle>
                <CardDescription className="text-purple-700">
                  You have administrative privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-700 mb-4">
                  Access the admin panel to manage users, content, and settings.
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/admin">Go to Admin Panel</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
