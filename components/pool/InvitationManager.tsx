'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Mail, Loader2, Check, X, UserPlus, Clock, AlertCircle } from 'lucide-react'

interface Invitation {
  id: string
  invitedEmail: string
  acceptedAt: string | null
  expiresAt: string
  createdAt: string
  acceptedBy?: {
    id: string
    name: string
    email: string
  } | null
}

interface InvitationManagerProps {
  cutId: string
  color: 'PURPLE' | 'ORANGE' | 'GREEN'
}

const colorStyles = {
  PURPLE: {
    bg: 'bg-purple-500',
    light: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300'
  },
  ORANGE: {
    bg: 'bg-orange-500',
    light: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300'
  },
  GREEN: {
    bg: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300'
  }
}

export function InvitationManager({ cutId, color }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const styles = colorStyles[color]

  useEffect(() => {
    fetchInvitations()
  }, [cutId])

  async function fetchInvitations() {
    try {
      const res = await fetch(`/api/pools/cuts/${cutId}/invitations`)
      if (res.ok) {
        const data = await res.json()
        setInvitations(data)
      }
    } catch (err) {
      console.error('Error fetching invitations:', err)
    } finally {
      setFetchLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch(`/api/pools/cuts/${cutId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, expiresInDays: 7 })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send invitation')
        return
      }

      setSuccess(true)
      setEmail('')
      fetchInvitations()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(invitationId: string) {
    try {
      const res = await fetch(`/api/pools/cuts/${cutId}/invitations?invitationId=${invitationId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchInvitations()
      }
    } catch (err) {
      console.error('Error revoking invitation:', err)
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <Card className={cn('border', styles.border)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className={cn('h-5 w-5', styles.text)} />
          <CardTitle className="font-display text-forest-800">Manage Invitations</CardTitle>
        </div>
        <CardDescription className="font-body">
          Invite members to join this color cut and make pledges
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Invite Form */}
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body">Email Address</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="pl-9"
                  disabled={loading}
                  required
                />
              </div>
              <Button
                type="submit"
                className={cn(styles.bg, 'text-white hover:opacity-90')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <Check className="h-4 w-4 flex-shrink-0" />
              Invitation sent successfully!
            </div>
          )}
        </form>

        {/* Invitations List */}
        <div className="space-y-3">
          <h4 className="font-medium font-body text-forest-700">Sent Invitations</h4>

          {fetchLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4 font-body">
              No invitations sent yet
            </p>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    invitation.acceptedAt
                      ? 'bg-green-50 border-green-200'
                      : isExpired(invitation.expiresAt)
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-200'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate font-body">
                      {invitation.invitedEmail}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {invitation.acceptedAt ? (
                        <>
                          <Check className="h-3 w-3 text-green-600" />
                          <span>Accepted by {invitation.acceptedBy?.name}</span>
                        </>
                      ) : isExpired(invitation.expiresAt) ? (
                        <>
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>Expired</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Expires {formatRelativeTime(invitation.expiresAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!invitation.acceptedAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(invitation.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
