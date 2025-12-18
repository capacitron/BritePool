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
  Globe,
  Lock,
  Bell,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string
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
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    timezone: 'UTC',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

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
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update profile' })
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
      setPasswordMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to change password' })
    } finally {
      setChangingPassword(false)
    }
  }

  function getRoleBadgeStyles(role: string): string {
    const styles: Record<string, string> = {
      WEB_STEWARD: 'bg-purple-100 text-purple-800 border-purple-200',
      BOARD_CHAIR: 'bg-amber-100 text-amber-800 border-amber-200',
      COMMITTEE_LEADER: 'bg-blue-100 text-blue-800 border-blue-200',
      CONTENT_MODERATOR: 'bg-teal-100 text-teal-800 border-teal-200',
      SUPPORT_STAFF: 'bg-gray-100 text-gray-800 border-gray-200',
      STEWARD: 'bg-green-100 text-green-800 border-green-200',
      PARTNER: 'bg-orange-100 text-orange-800 border-orange-200',
      RESIDENT: 'bg-stone-100 text-stone-800 border-stone-200',
    }
    return styles[role] || 'bg-gray-100 text-gray-800'
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
        <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-earth-brown-light">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">Profile Settings</h1>
        <p className="text-earth-brown-light mt-1">Manage your account information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-earth-brown text-white text-2xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-serif font-bold text-earth-brown-dark">{profile.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border',
                    getRoleBadgeStyles(profile.role)
                  )}
                >
                  {profile.role.replace(/_/g, ' ')}
                </span>
                <span className="text-sm text-earth-brown-light flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
              </div>
              <p className="text-xs text-earth-brown-light mt-2">
                Member since {formatDate(profile.createdAt)}
                {profile.lastLoginAt && ` • Last login ${formatDate(profile.lastLoginAt)}`}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-sage" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {message && (
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg text-sm',
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-brown-light" />
                  <Input
                    id="phone"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-brown-light" />
                  <Input
                    id="location"
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-brown-light" />
                  <select
                    id="timezone"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone bg-white text-earth-dark focus:outline-none focus:ring-2 focus:ring-earth-brown"
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
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="w-full px-4 py-2 rounded-lg border border-stone bg-white text-earth-dark focus:outline-none focus:ring-2 focus:ring-earth-brown min-h-[100px]"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-earth-brown-light">{formData.bio.length}/500 characters</p>
            </div>

            <Button type="submit" disabled={saving}>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-terracotta" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordMessage && (
              <div
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg text-sm',
                  passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <p className="text-xs text-earth-brown-light">
              Password must be at least 8 characters long
            </p>

            <Button type="submit" variant="outline" disabled={changingPassword}>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-sky-soft" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-earth-dark">Email Notifications</p>
                <p className="text-sm text-earth-brown-light">Receive updates about events and announcements</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-stone text-earth-brown focus:ring-earth-brown"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-earth-dark">Task Reminders</p>
                <p className="text-sm text-earth-brown-light">Get notified about upcoming task deadlines</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-stone text-earth-brown focus:ring-earth-brown"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-earth-dark">Committee Updates</p>
                <p className="text-sm text-earth-brown-light">Notifications about your committee activities</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-stone text-earth-brown focus:ring-earth-brown"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-earth-dark">Weekly Digest</p>
                <p className="text-sm text-earth-brown-light">Summary of community activities</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stone text-earth-brown focus:ring-earth-brown"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
