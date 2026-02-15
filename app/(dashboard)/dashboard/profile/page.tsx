'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatDate } from '@/lib/utils'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Lock,
  Bell,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Link2,
  Copy,
} from 'lucide-react'
import { WGOInvolvementsSection } from '@/components/profile/WGOInvolvementsSection'
import { PageHeader } from '@/components/PageHeader'

interface UserProfile {
  id: string
  email: string
  name: string
  username: string | null
  role: string
  covenantAcceptedAt: string | null
  subscriptionTier: string
  subscriptionStatus: string
  createdAt: string
  lastLoginAt: string | null
  profile: {
    bio: string | null
    phone: string | null
    location: string | null
    timezone: string
    language: string
  } | null
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Costa_Rica',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    phone: '',
    location: '',
    timezone: 'UTC',
  })
  const [linkCopied, setLinkCopied] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(true)
  const [showNewPassword, setShowNewPassword] = useState(true)
  const [showConfirmPassword, setShowConfirmPassword] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch profile')
      }
      const data = await res.json()
      setProfile(data)
      setFormData({
        name: data.name || '',
        username: data.username || '',
        bio: data.profile?.bio || '',
        phone: data.profile?.phone || '',
        location: data.profile?.location || '',
        timezone: data.profile?.timezone || 'UTC',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' })
      fetchProfile()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangingPassword(true)
    setPasswordMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      setChangingPassword(false)
      return
    }

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to change password')
      }

      setPasswordMessage({ type: 'success', text: 'Password changed successfully' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to change password',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  function getRoleBadgeStyles(role: string): string {
    const styles: Record<string, string> = {
      WEB_STEWARD: 'bg-earth-100 text-earth-700 border-earth-300',
      BOARD_CHAIR: 'bg-sand-200 text-sand-800 border-sand-400',
      COMMITTEE_LEADER: 'bg-forest-100 text-forest-700 border-forest-300',
      CONTENT_MODERATOR: 'bg-forest-50 text-forest-600 border-forest-200',
      SUPPORT_STAFF: 'bg-sand-100 text-sand-700 border-sand-300',
      STEWARD: 'bg-forest-100 text-forest-800 border-forest-300',
      PARTNER: 'bg-earth-50 text-earth-600 border-earth-200',
      RESIDENT: 'bg-sand-50 text-sand-600 border-sand-200',
    }
    return styles[role] || 'bg-sand-100 text-sand-700'
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-forest-500 font-body">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader path="profile" />

      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">Profile Settings</h1>
        <p className="text-forest-500 mt-1 font-body">
          Manage your account information and preferences
        </p>
      </div>

      <Card className="border-sand-200">
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-forest-600 text-white text-2xl font-display">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-display font-bold text-forest-800">{profile.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border font-body',
                    getRoleBadgeStyles(profile.role)
                  )}
                >
                  {profile.role.replace(/_/g, ' ')}
                </span>
                <span className="text-sm text-forest-500 flex items-center gap-1 font-body">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
              </div>
              <p className="text-xs text-forest-400 mt-2 font-body">
                Member since {formatDate(profile.createdAt)}
                {profile.lastLoginAt && ` • Last login ${formatDate(profile.lastLoginAt)}`}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <User className="h-5 w-5 text-forest-500" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {message && (
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg text-sm font-body',
                  message.type === 'success'
                    ? 'bg-forest-50 text-forest-700'
                    : 'bg-earth-50 text-earth-700'
                )}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message.text}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-forest-700 font-body">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  className="border-sand-300 focus:border-forest-500 focus:ring-forest-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-forest-700 font-body">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
                  <Input
                    id="phone"
                    className="pl-10 border-sand-300 focus:border-forest-500 focus:ring-forest-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-forest-700 font-body">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
                  <Input
                    id="location"
                    className="pl-10 border-sand-300 focus:border-forest-500 focus:ring-forest-500"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-forest-700 font-body">
                  Timezone
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
                  <select
                    id="timezone"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-sand-300 bg-white text-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-forest-700 font-body">
                Bio
              </Label>
              <textarea
                id="bio"
                className="w-full px-4 py-2 rounded-lg border border-sand-300 bg-white text-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500 min-h-[100px] font-body"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-forest-400 font-body">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-forest-600 hover:bg-forest-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <Link2 className="h-5 w-5 text-forest-500" />
            Referral Link
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Create your unique BritePool username to generate a shareable referral link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-forest-700 font-body">
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                })
              }
              placeholder="your-username"
              className="border-sand-300 focus:border-forest-500 focus:ring-forest-500"
              maxLength={30}
            />
            <p className="text-xs text-forest-400 font-body">
              Lowercase letters, numbers, and hyphens only. 3-30 characters.
            </p>
          </div>

          {profile?.username && (
            <div className="space-y-2">
              <Label className="text-forest-700 font-body">Your Shareable Referral Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`https://britepool.org/${profile.username}`}
                  readOnly
                  className="border-sand-300 bg-sand-50 text-forest-700"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 border-forest-600 text-forest-700 hover:bg-forest-600 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://britepool.org/${profile.username}`)
                    setLinkCopied(true)
                    setTimeout(() => setLinkCopied(false), 2000)
                  }}
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-forest-400 font-body">
                Share this link with prospective members. When they register, they will be
                automatically linked to you.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <Lock className="h-5 w-5 text-earth-500" />
            Change Password
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordMessage && (
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg text-sm font-body',
                  passwordMessage.type === 'success'
                    ? 'bg-forest-50 text-forest-700'
                    : 'bg-earth-50 text-earth-700'
                )}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {passwordMessage.text}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-forest-700 font-body">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                    className="border-sand-300 focus:border-forest-500 focus:ring-forest-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-forest-700 font-body">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Enter new password"
                    className="border-sand-300 focus:border-forest-500 focus:ring-forest-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-forest-700 font-body">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Confirm new password"
                    className="border-sand-300 focus:border-forest-500 focus:ring-forest-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-forest-400 font-body">
              Password must be at least 8 characters long
            </p>

            <Button
              type="submit"
              variant="outline"
              disabled={changingPassword}
              className="border-forest-600 text-forest-700 hover:bg-forest-600 hover:text-white"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <Bell className="h-5 w-5 text-sand-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-forest-700 font-body">Email Notifications</p>
                <p className="text-sm text-forest-500 font-body">
                  Receive updates about events and announcements
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-forest-700 font-body">Task Reminders</p>
                <p className="text-sm text-forest-500 font-body">
                  Get notified about upcoming task deadlines
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-forest-700 font-body">Committee Updates</p>
                <p className="text-sm text-forest-500 font-body">
                  Notifications about your committee activities
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-forest-700 font-body">Weekly Digest</p>
                <p className="text-sm text-forest-500 font-body">Summary of community activities</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <WGOInvolvementsSection />
    </div>
  )
}
