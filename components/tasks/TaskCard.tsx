'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getPriorityColors } from '@/lib/design-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, User } from 'lucide-react'

interface TaskCardProps {
  task: {
    id: string
    title: string
    priority: string
    dueDate: string | null
    assignedTo: { id: string; name: string } | null
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
  const priorityColors = getPriorityColors(task.priority)

  return (
    <Link href={`/dashboard/tasks/${task.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {task.title}
            </CardTitle>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
                priorityColors.bg,
                priorityColors.text
              )}
            >
              {task.priority}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-earth-brown-light">
            {task.dueDate && (
              <div className={cn('flex items-center gap-1', isOverdue && 'text-earth-600')}>
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </div>
            )}
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignedTo.name.split(' ')[0]}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
