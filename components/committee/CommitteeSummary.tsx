'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import {
  Sparkles,
  ListChecks,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'

interface ExtractedTask {
  id: string
  taskTitle: string
  taskDescription: string | null
  assignedToName: string | null
  dueDate: string | null
  status: 'PENDING' | 'CONVERTED' | 'DISMISSED'
}

interface ChatSummary {
  id: string
  weekStarting: string
  weekEnding: string
  summary: string
  generatedAt: string
  tasks: ExtractedTask[]
}

interface CommitteeSummaryProps {
  committeeId: string
  isLeader: boolean
}

type ChatCategory = 'GENERAL' | 'ANNOUNCEMENTS' | 'PROJECTS' | 'RESOURCES' | 'QUESTIONS'

const CATEGORIES: { id: ChatCategory; label: string }[] = [
  { id: 'GENERAL', label: 'General' },
  { id: 'ANNOUNCEMENTS', label: 'Announcements' },
  { id: 'PROJECTS', label: 'Projects' },
  { id: 'RESOURCES', label: 'Resources' },
  { id: 'QUESTIONS', label: 'Q&A' },
]

export function CommitteeSummary({ committeeId, isLeader }: CommitteeSummaryProps) {
  const [summaries, setSummaries] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('GENERAL')
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null)

  useEffect(() => {
    fetchSummaries()
  }, [committeeId, activeCategory])

  async function fetchSummaries() {
    setLoading(true)
    try {
      const res = await fetch(`/api/committees/${committeeId}/summary?category=${activeCategory}`)
      if (res.ok) {
        const data = await res.json()
        setSummaries(data)
        if (data.length > 0) {
          setExpandedSummary(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch summaries:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateSummary() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/committees/${committeeId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeCategory }),
      })

      if (res.ok) {
        await fetchSummaries()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to generate summary')
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
    } finally {
      setGenerating(false)
    }
  }

  function formatWeekRange(start: string, end: string): string {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
  }

  function getTaskStatusIcon(status: string) {
    switch (status) {
      case 'CONVERTED':
        return <CheckCircle2 className="h-4 w-4 text-forest-600" />
      case 'DISMISSED':
        return <XCircle className="h-4 w-4 text-earth-500" />
      default:
        return <Circle className="h-4 w-4 text-sand-500" />
    }
  }

  return (
    <Card className="border-sand-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <Sparkles className="h-5 w-5 text-earth-500" />
            AI Weekly Summaries
          </CardTitle>
          {isLeader && (
            <Button
              onClick={handleGenerateSummary}
              disabled={generating}
              size="sm"
              className="bg-earth-500 hover:bg-earth-600 text-white"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate Summary
            </Button>
          )}
        </div>

        <p className="text-sm text-forest-500 font-body mt-1">
          AI-powered summaries that condense weekly discussions into actionable task items
        </p>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-body transition-colors',
                activeCategory === cat.id
                  ? 'bg-earth-500 text-white'
                  : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-forest-400">
            <Sparkles className="h-12 w-12 mb-2" />
            <p className="font-body">No summaries generated yet</p>
            {isLeader ? (
              <p className="text-sm">Click "Generate Summary" to create one from this week's chat</p>
            ) : (
              <p className="text-sm">Committee leaders can generate weekly summaries</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="border border-sand-200 rounded-xl overflow-hidden"
              >
                {/* Summary Header */}
                <button
                  onClick={() => setExpandedSummary(
                    expandedSummary === summary.id ? null : summary.id
                  )}
                  className="w-full flex items-center justify-between p-4 bg-sand-50 hover:bg-sand-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-forest-500" />
                    <div className="text-left">
                      <h4 className="font-medium text-forest-800 font-body">
                        Week of {formatWeekRange(summary.weekStarting, summary.weekEnding)}
                      </h4>
                      <p className="text-xs text-forest-400 font-body">
                        Generated {formatDate(summary.generatedAt)} • {summary.tasks.length} tasks extracted
                      </p>
                    </div>
                  </div>
                  {expandedSummary === summary.id ? (
                    <ChevronUp className="h-5 w-5 text-forest-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-forest-400" />
                  )}
                </button>

                {/* Expanded Content */}
                {expandedSummary === summary.id && (
                  <div className="p-4 space-y-4">
                    {/* Summary Text */}
                    <div className="bg-forest-50 p-4 rounded-lg">
                      <h5 className="flex items-center gap-2 text-sm font-medium text-forest-700 mb-2 font-body">
                        <Sparkles className="h-4 w-4" />
                        Discussion Summary
                      </h5>
                      <p className="text-sm text-forest-600 whitespace-pre-wrap font-body">
                        {summary.summary}
                      </p>
                    </div>

                    {/* Extracted Tasks */}
                    {summary.tasks.length > 0 && (
                      <div>
                        <h5 className="flex items-center gap-2 text-sm font-medium text-forest-700 mb-3 font-body">
                          <ListChecks className="h-4 w-4" />
                          Extracted Action Items ({summary.tasks.length})
                        </h5>
                        <div className="space-y-2">
                          {summary.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-3 bg-white border border-sand-200 rounded-lg"
                            >
                              {getTaskStatusIcon(task.status)}
                              <div className="flex-1">
                                <p className={cn(
                                  'text-sm font-medium font-body',
                                  task.status === 'DISMISSED' ? 'text-forest-400 line-through' : 'text-forest-800'
                                )}>
                                  {task.taskTitle}
                                </p>
                                {task.taskDescription && (
                                  <p className="text-xs text-forest-500 mt-1 font-body">
                                    {task.taskDescription}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-forest-400 font-body">
                                  {task.assignedToName && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {task.assignedToName}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Due {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-body',
                                task.status === 'PENDING' && 'bg-sand-100 text-sand-700',
                                task.status === 'CONVERTED' && 'bg-forest-100 text-forest-700',
                                task.status === 'DISMISSED' && 'bg-earth-50 text-earth-600'
                              )}>
                                {task.status.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
