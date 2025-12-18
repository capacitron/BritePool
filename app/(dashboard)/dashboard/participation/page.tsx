'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Clock, Award, TrendingUp, Loader2, CheckCircle, 
  XCircle, AlertCircle, Plus
} from 'lucide-react'

interface ParticipationLog {
  id: string
  hours: number
  description: string
  category: string
  status: string
  createdAt: string
  approvedAt: string | null
}

interface Summary {
  totalHours: number
  pendingHours: number
  equityUnits: number
  totalLogs: number
}

const categories = [
  'Committee Work',
  'Community Service',
  'Event Organization',
  'Mentoring',
  'Project Development',
  'Administrative',
  'Outreach',
  'Other',
]

const statusIcons: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle className="h-4 w-4 text-green-600" />,
  PENDING: <AlertCircle className="h-4 w-4 text-amber-600" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-600" />,
}

const statusColors: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function ParticipationPage() {
  const [logs, setLogs] = useState<ParticipationLog[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalHours: 0,
    pendingHours: 0,
    equityUnits: 0,
    totalLogs: 0,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    hours: '',
    category: '',
    description: '',
  })

  useEffect(() => {
    fetchParticipation()
  }, [])

  async function fetchParticipation() {
    try {
      const res = await fetch('/api/participation')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch participation:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parseFloat(formData.hours),
          category: formData.category,
          description: formData.description,
        }),
      })

      if (res.ok) {
        setFormData({ hours: '', category: '', description: '' })
        setShowForm(false)
        await fetchParticipation()
      }
    } catch (error) {
      console.error('Failed to log participation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            Sacred Ledger
          </h1>
          <p className="text-earth-brown-light mt-1">
            Track your participation and earn equity units
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Participation
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Hours Logged
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-earth-brown-dark">
              {summary.totalHours.toFixed(1)}
            </p>
            {summary.pendingHours > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                + {summary.pendingHours.toFixed(1)} pending
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Equity Units Earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-earth-brown-dark">
              {summary.equityUnits}
            </p>
            <p className="text-xs text-earth-brown-light mt-1">
              10 hours = 1 unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress to Next Unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-earth-brown-dark">
                {((summary.totalHours % 10) / 10 * 100).toFixed(0)}%
              </p>
              <div className="w-full bg-stone h-2 rounded-full">
                <div 
                  className="bg-earth-brown h-2 rounded-full transition-all"
                  style={{ width: `${(summary.totalHours % 10) / 10 * 100}%` }}
                />
              </div>
              <p className="text-xs text-earth-brown-light">
                {(10 - (summary.totalHours % 10)).toFixed(1)} hours to next unit
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Log Participation Hours</CardTitle>
            <CardDescription>
              Record your community participation to earn equity units
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    placeholder="e.g., 2.5"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full h-10 px-3 rounded-md border border-stone bg-white text-earth-dark"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-stone bg-white text-earth-dark resize-none"
                  placeholder="Describe the work you did..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Participation History</CardTitle>
          <CardDescription>
            Your logged hours and approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
              <p className="text-earth-brown-light">No participation logged yet</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                Log Your First Participation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-stone-warm rounded-lg">
                  <div className="mt-1">
                    {statusIcons[log.status]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-earth-brown-dark">
                          {log.category}
                        </p>
                        <p className="text-sm text-earth-brown-light mt-1">
                          {log.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-earth-brown-dark">
                          {log.hours} hours
                        </p>
                        <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${statusColors[log.status]}`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-earth-brown-light mt-2">
                      Logged on {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
