import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaskDetailClient } from './TaskDetailClient'

interface TaskDetailPageProps {
  params: Promise<{ taskId: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { taskId } = await params

  const [task, users, committees] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, role: true }
        },
        committee: {
          select: { id: true, name: true, slug: true }
        }
      }
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

  if (!task) {
    notFound()
  }

  const formattedTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString().split('T')[0] || null,
    completedAt: task.completedAt?.toISOString() || null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignedTo: task.assignedTo,
    committee: task.committee,
  }

  return (
    <TaskDetailClient
      task={formattedTask}
      users={users}
      committees={committees}
    />
  )
}
