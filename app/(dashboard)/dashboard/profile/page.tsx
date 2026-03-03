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
  CalendarClock,
  UserPlus,
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
    availability: Record<string, { enabled: boolean; start: string; end: string }> | null
  } | null
  referredBy: {
    id: string
    name: string
    role: string
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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const TIME_OPTIONS = (() => {
  const options: { value: string; label: string }[] = []
  for (let h = 6; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, '0')
      const mm = m.toString().padStart(2, '0')
      const period = h < 12 ? 'AM' : 'PM'
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
      options.push({ value: `${hh}:${mm}`, label: `${displayH}:${mm} ${period}` })
    }
  }
  return options
})()

const DEFAULT_AVAILABILITY: Record<string, { enabled: boolean; start: string; end: string }> = {
  monday: { enabled: false, start: '09:00', end: '17:00' },
  tuesday: { enabled: false, start: '09:00', end: '17:00' },
  wednesday: { enabled: false, start: '09:00', end: '17:00' },
  thursday: { enabled: false, start: '09:00', end: '17:00' },
  friday: { enabled: false, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' },
}

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
  const [availability, setAvailability] = useState<
    Record<string, { enabled: boolean; start: string; end: string }>
  >({ ...DEFAULT_AVAILABILITY })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      if (data.profile?.availability) {
        setAvailability({ ...DEFAULT_AVAILABILITY, ...data.profile.availability })
      }
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
        body: JSON.stringify({ ...formData, availability }),
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

      {profile.referredBy && (
        <Card className="border-sand-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <UserPlus className="h-5 w-5 text-forest-500" />
              Introduced By
            </CardTitle>
            <CardDescription className="text-forest-500 font-body">
              The member who introduced you to Brite Pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-forest-50 rounded-lg border border-forest-100">
              <div className="w-12 h-12 rounded-full bg-forest-600 flex items-center justify-center text-white font-bold text-lg">
                {profile.referredBy.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-forest-800 font-body">{profile.referredBy.name}</p>
                <p className="text-sm text-forest-500 font-body">
                  {profile.referredBy.role.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            Referral Link &amp; Outreach
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Create or edit your unique Brite Pool username below. This username generates a personal
            referral link you can share with anyone interested in joining the community. When
            someone signs up through your link, they are automatically connected to you as their
            referrer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-forest-700 font-body">
              Your Brite Pool Username
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
            <div className="space-y-4">
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
                <p className="text-sm text-forest-500 font-body">
                  Copy this link and share it directly, or use the quick-share buttons below to post
                  it on your favorite platform.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-forest-700 font-body">Quick Share</Label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const url = encodeURIComponent(`https://britepool.org/${profile.username}`)
                    const text = encodeURIComponent('Join me on BritePool!')
                    return (
                      <>
                        <a
                          href={`https://x.com/intent/tweet?text=${text}&url=${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black text-white hover:bg-gray-800 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          Post
                        </a>
                        <a
                          href={`https://t.me/share/url?url=${url}&text=${text}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2AABEE] text-white hover:bg-[#229ED9] transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                          </svg>
                          Telegram
                        </a>
                        <a
                          href={`https://wa.me/?text=${text}%20${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#25D366] text-white hover:bg-[#1DA851] transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </a>
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </a>
                        <a
                          href={`mailto:?subject=${text}&body=${text}%20${url}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          Email
                        </a>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="rounded-lg border-2 border-forest-200 bg-forest-50 p-4 mt-2">
                <h4 className="text-base font-display font-semibold text-forest-800 mb-1">
                  Outreach Toolkit
                </h4>
                <p className="text-sm text-forest-600 font-body mb-3">
                  Use ready-to-go templates to spread the word about Brite Pool. Choose from
                  pre-written email drafts, social media posts, and Instagram-ready graphics — just
                  copy, personalize, and send.
                </p>
                <a
                  href="/dashboard/outreach"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-forest-600 text-white hover:bg-forest-700 transition-colors font-body"
                >
                  <UserPlus className="h-4 w-4" />
                  Open Outreach Toolkit
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-sand-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <CalendarClock className="h-5 w-5 text-forest-500" />
            My Availability
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Set your weekly availability so other members know when you&apos;re free
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const day = availability[key] ?? { enabled: false, start: '09:00', end: '17:00' }
              const updateDay = (updates: Partial<typeof day>) =>
                setAvailability({ ...availability, [key]: { ...day, ...updates } })
              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    day.enabled ? 'bg-forest-50' : 'bg-sand-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay({ enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-500"
                  />
                  <span
                    className={cn(
                      'w-24 text-sm font-medium font-body',
                      day.enabled ? 'text-forest-800' : 'text-forest-400'
                    )}
                  >
                    {label}
                  </span>
                  <select
                    value={day.start}
                    onChange={(e) => updateDay({ start: e.target.value })}
                    disabled={!day.enabled}
                    className={cn(
                      'px-2 py-1.5 rounded-lg border text-sm font-body',
                      day.enabled
                        ? 'border-sand-300 bg-white text-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500'
                        : 'border-sand-200 bg-sand-100 text-forest-300 cursor-not-allowed'
                    )}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className={cn(
                      'text-sm font-body',
                      day.enabled ? 'text-forest-500' : 'text-forest-300'
                    )}
                  >
                    to
                  </span>
                  <select
                    value={day.end}
                    onChange={(e) => updateDay({ end: e.target.value })}
                    disabled={!day.enabled}
                    className={cn(
                      'px-2 py-1.5 rounded-lg border text-sm font-body',
                      day.enabled
                        ? 'border-sand-300 bg-white text-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500'
                        : 'border-sand-200 bg-sand-100 text-forest-300 cursor-not-allowed'
                    )}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-forest-400 font-body mt-3">
            Times are based on your selected timezone ({formData.timezone.replace(/_/g, ' ')}). Save
            changes above to update.
          </p>
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
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
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
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
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
