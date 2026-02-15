'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ModerationQueue } from '@/components/admin/ModerationQueue'

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

interface Counts {
  forum: number
  media: number
  total: number
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [counts, setCounts] = useState<Counts>({ forum: 0, media: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const typeMap: Record<string, string> = { all: 'all', forum: 'forum_post', media: 'media' }
      const type = typeMap[activeTab] || 'all'
      const response = await fetch(`/api/admin/moderation?type=${type}&status=PENDING`)
      const data = await response.json()

      if (response.ok && data.success) {
        setItems(data.data?.items || [])
        setCounts(data.data?.counts || { forum: 0, media: 0, total: 0 })
      }
    } catch (error) {
      console.error('Error fetching moderation queue:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Moderation</h1>
        <p className="text-slate-600">Review and approve pending content submissions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <span>All</span>
            {counts?.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts?.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forum" className="flex items-center space-x-2">
            <span>Forum Posts</span>
            {counts?.forum > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts?.forum}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center space-x-2">
            <span>Media</span>
            {counts?.media > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts?.media}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="mt-0">
                <ModerationQueue items={items} onRefresh={fetchItems} />
              </TabsContent>
              <TabsContent value="forum" className="mt-0">
                <ModerationQueue
                  items={items.filter((item) => item.type === 'forum')}
                  onRefresh={fetchItems}
                />
              </TabsContent>
              <TabsContent value="media" className="mt-0">
                <ModerationQueue
                  items={items.filter((item) => item.type === 'media')}
                  onRefresh={fetchItems}
                />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  )
}
