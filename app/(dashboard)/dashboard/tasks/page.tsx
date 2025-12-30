import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { PageHeader } from '@/components/PageHeader'

export default async function TasksPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const [tasks, users, committees] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { not: 'CANCELLED' }
      },
      include: {
        assignedTo: {
          select: { id: true, name: true }
        },
        committee: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.committee.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ])

  const formattedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() || null,
    assignedTo: task.assignedTo,
  }))

  return (
    <div className="space-y-6">
      <PageHeader path="tasks" />

      <TaskBoard
        tasks={formattedTasks}
        users={users}
        committees={committees}
      />
    </div>
  )
}
