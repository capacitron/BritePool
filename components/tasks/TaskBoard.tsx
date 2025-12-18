'use client'

import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { CreateTaskModal } from './CreateTaskModal'
import { Button } from '@/components/ui/button'
import { Plus, Filter } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignedTo: { id: string; name: string } | null
}

interface User {
  id: string
  name: string
}

interface Committee {
  id: string
  name: string
}

interface TaskBoardProps {
  tasks: Task[]
  users: User[]
  committees: Committee[]
}

const columns = [
  { key: 'TODO', label: 'To Do', color: 'bg-gray-100' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { key: 'COMPLETED', label: 'Completed', color: 'bg-green-100' },
]

export function TaskBoard({ tasks, users, committees }: TaskBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter && task.priority !== priorityFilter) return false
    return true
  })

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter((task) => task.status === status)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          {showFilters && (
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border border-stone rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-earth-brown"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          )}
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.key} className="space-y-3">
            <div className={`px-4 py-2 rounded-lg ${column.color}`}>
              <h3 className="font-medium text-earth-brown-dark flex items-center justify-between">
                {column.label}
                <span className="text-sm text-earth-brown-light">
                  {getTasksByStatus(column.key).length}
                </span>
              </h3>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {getTasksByStatus(column.key).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {getTasksByStatus(column.key).length === 0 && (
                <div className="text-center py-8 text-earth-brown-light text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={users}
        committees={committees}
      />
    </div>
  )
}
