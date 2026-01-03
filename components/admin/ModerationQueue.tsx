'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ModerationItem {
  id: string
  type: 'forum' | 'media'
  title: string
  preview: string
  mediaType?: string
  category?: string
  status: string
  createdAt: string
  author: {
    id: string
    name: string
    email: string
  }
}

interface ModerationQueueProps {
  items: ModerationItem[]
  onRefresh: () => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ModerationQueue({ items, onRefresh }: ModerationQueueProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async (item: ModerationItem) => {
    setLoading(item.id)
    try {
      const response = await fetch(`/api/admin/moderation/${item.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type }),
      })

      if (response.ok) {
        onRefresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to approve content')
      }
    } catch {
      alert('Failed to approve content')
    } finally {
      setLoading(null)
    }
  }

  const openRejectDialog = (item: ModerationItem) => {
    setSelectedItem(item)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleReject = async () => {
    if (!selectedItem || !rejectReason.trim()) return

    setLoading(selectedItem.id)
    try {
      const response = await fetch(`/api/admin/moderation/${selectedItem.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedItem.type,
          reason: rejectReason,
        }),
      })

      if (response.ok) {
        setRejectDialogOpen(false)
        setSelectedItem(null)
        onRefresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to reject content')
      }
    } catch {
      alert('Failed to reject content')
    } finally {
      setLoading(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
        <p className="text-slate-600">No content pending moderation</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {item.type === 'media' && (
                  <div className="w-32 h-32 flex-shrink-0 bg-slate-100">
                    <img
                      src={item.preview}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'forum' ? 'Forum Post' : 'Media Upload'}
                        </Badge>
                        {item.mediaType && (
                          <Badge variant="secondary" className="text-xs">
                            {item.mediaType}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-slate-900">{item.title}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(item)}
                        disabled={loading === item.id}
                      >
                        {loading === item.id ? '...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openRejectDialog(item)}
                        disabled={loading === item.id}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>

                  {item.type === 'forum' && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.preview}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      By <span className="font-medium">{item.author.name}</span> (
                      {item.author.email})
                    </span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this content. This will be sent to the author.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Content violates community guidelines"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || loading === selectedItem?.id}
            >
              {loading === selectedItem?.id ? 'Rejecting...' : 'Reject Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
