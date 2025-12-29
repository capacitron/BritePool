'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatDate } from '@/lib/utils'
import {
  MessageSquare,
  Send,
  Loader2,
  Megaphone,
  FolderKanban,
  BookOpen,
  HelpCircle,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    role: string
  }
  attachmentUrl?: string
  attachmentName?: string
}

interface CommitteeChatProps {
  committeeId: string
  currentUserId: string
}

type ChatCategory = 'GENERAL' | 'ANNOUNCEMENTS' | 'PROJECTS' | 'RESOURCES' | 'QUESTIONS'

const CATEGORIES: { id: ChatCategory; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'GENERAL', label: 'General', icon: <MessageSquare className="h-4 w-4" />, description: 'General discussion' },
  { id: 'ANNOUNCEMENTS', label: 'Announcements', icon: <Megaphone className="h-4 w-4" />, description: 'Important updates' },
  { id: 'PROJECTS', label: 'Projects', icon: <FolderKanban className="h-4 w-4" />, description: 'Project discussions' },
  { id: 'RESOURCES', label: 'Resources', icon: <BookOpen className="h-4 w-4" />, description: 'Shared resources' },
  { id: 'QUESTIONS', label: 'Q&A', icon: <HelpCircle className="h-4 w-4" />, description: 'Questions & answers' },
]

export function CommitteeChat({ committeeId, currentUserId }: CommitteeChatProps) {
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('GENERAL')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [committeeId, activeCategory])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function fetchMessages() {
    setLoading(true)
    try {
      const res = await fetch(`/api/committees/${committeeId}/chat?category=${activeCategory}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/committees/${committeeId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          category: activeCategory,
        }),
      })

      if (res.ok) {
        const message = await res.json()
        setMessages((prev) => [...prev, message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  async function handleEditMessage(messageId: string) {
    if (!editContent.trim()) return

    try {
      const res = await fetch(`/api/committees/${committeeId}/chat/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })

      if (res.ok) {
        const updated = await res.json()
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? updated : m))
        )
        setEditingId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const res = await fetch(`/api/committees/${committeeId}/chat/${messageId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function getRoleBadgeStyles(role: string): string {
    const styles: Record<string, string> = {
      WEB_STEWARD: 'bg-earth-100 text-earth-700',
      BOARD_CHAIR: 'bg-sand-200 text-sand-800',
      COMMITTEE_LEADER: 'bg-forest-100 text-forest-700',
      CONTENT_MODERATOR: 'bg-forest-50 text-forest-600',
      STEWARD: 'bg-forest-100 text-forest-800',
    }
    return styles[role] || 'bg-sand-100 text-sand-700'
  }

  return (
    <Card className="border-sand-200 flex flex-col h-[600px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <MessageSquare className="h-5 w-5 text-forest-500" />
          Committee Chat
        </CardTitle>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body transition-colors',
                activeCategory === cat.id
                  ? 'bg-forest-600 text-white'
                  : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
              )}
              title={cat.description}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-forest-400">
              <MessageSquare className="h-12 w-12 mb-2" />
              <p className="font-body">No messages yet in {CATEGORIES.find(c => c.id === activeCategory)?.label}</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.author.id === currentUserId ? 'flex-row-reverse' : ''
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-forest-600 text-white text-xs">
                    {getInitials(message.author.name)}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    'max-w-[70%]',
                    message.author.id === currentUserId ? 'text-right' : ''
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-forest-700 font-body">
                      {message.author.name}
                    </span>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      getRoleBadgeStyles(message.author.role)
                    )}>
                      {message.author.role.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-forest-400 font-body">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>

                  {editingId === message.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMessage(message.id)}
                      >
                        <Check className="h-4 w-4 text-forest-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null)
                          setEditContent('')
                        }}
                      >
                        <X className="h-4 w-4 text-earth-600" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'p-3 rounded-lg font-body text-sm',
                        message.author.id === currentUserId
                          ? 'bg-forest-600 text-white'
                          : 'bg-sand-100 text-forest-800'
                      )}
                    >
                      {message.content}
                    </div>
                  )}

                  {message.author.id === currentUserId && !editingId && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button
                        onClick={() => {
                          setEditingId(message.id)
                          setEditContent(message.content)
                        }}
                        className="p-1 text-forest-400 hover:text-forest-600"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 text-forest-400 hover:text-earth-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message in ${CATEGORIES.find(c => c.id === activeCategory)?.label}...`}
            className="flex-1 border-sand-300 focus:border-forest-500 focus:ring-forest-500"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-forest-600 hover:bg-forest-700 text-white"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
