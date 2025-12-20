'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Phone, MapPin, Clock, FileText, Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    timezone: 'UTC',
  })

  useEffect(() => {
    // Pre-fill from session
    if (session?.user) {
      const nameParts = (session.user.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      setFormData((prev) => ({
        ...prev,
        firstName,
        lastName,
        email: session.user.email || '',
      }))
    }

    // Detect timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const matchedTimezone = timezones.find((tz) => tz.value === detectedTimezone)
    if (matchedTimezone) {
      setFormData((prev) => ({ ...prev, timezone: matchedTimezone.value }))
    }

    // Fetch existing profile data
    async function fetchProfile() {
      try {
        const response = await fetch('/api/onboarding')
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setFormData((prev) => ({
              ...prev,
              bio: data.profile.bio || '',
              phone: data.profile.phone || '',
              location: data.profile.location || '',
              timezone: data.profile.timezone || prev.timezone,
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
    fetchProfile()
  }, [session])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (formData.phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          profile: {
            bio: formData.bio,
            phone: formData.phone,
            location: formData.location,
            timezone: formData.timezone,
          },
        }),
      })
      router.push('/onboarding/interests')
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/welcome')
  }

  const completionPercentage = () => {
    const fields = ['firstName', 'lastName', 'phone', 'location', 'bio']
    const filled = fields.filter((f) => formData[f as keyof typeof formData]?.toString().trim())
    return Math.round((filled.length / fields.length) * 100)
  }

  const percentage = completionPercentage()

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='20' fill='none' stroke='%23fff' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='10' fill='none' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-earth-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-forest-400/15 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-earth-400 to-transparent" />
              <span className="text-earth-300 text-sm font-medium uppercase tracking-wider font-body">Step 2 of 4</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Create Your Profile</h1>
            <p className="text-sand-200 max-w-md font-body">Tell us about yourself to personalize your BRITE POOL experience</p>
          </div>

          {/* Progress Ring */}
          <div className="hidden md:flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#ea8f6f"
                  strokeWidth="6"
                  strokeDasharray={`${percentage * 2.51} 251`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold font-display">{percentage}%</span>
              </div>
            </div>
            <span className="text-sand-300 text-xs mt-2 font-body">Complete</span>
          </div>
        </div>
      </div>

      {/* Avatar Section */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-sand-100 to-forest-50 p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-earth-400 to-earth-500 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-white to-sand-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <span className="text-4xl font-display font-bold text-forest-700">
                  {formData.firstName.charAt(0).toUpperCase() || '?'}
                  {formData.lastName.charAt(0).toUpperCase() || ''}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-earth-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-display font-bold text-forest-800">
                {formData.firstName || formData.lastName
                  ? `${formData.firstName} ${formData.lastName}`.trim()
                  : 'Your Name'}
              </h3>
              <p className="text-forest-500 text-sm mt-1 font-body">New BRITE POOL Member</p>
              <p className="text-forest-400 text-xs mt-2 font-body">
                Avatar upload available in dashboard settings
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Form Sections */}
      <div className="grid gap-6">
        {/* Personal Information */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-forest-500 to-forest-300" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center group-hover:bg-forest-200 transition-colors">
                <User className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-forest-800 text-lg">Personal Information</h3>
                <p className="text-sm text-forest-500 font-body">Your name and identity</p>
              </div>
              {formData.firstName && formData.lastName && (
                <CheckCircle2 className="w-5 h-5 text-forest-500 ml-auto" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-forest-700 font-medium font-body">
                  First Name <span className="text-earth-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className={`mt-1.5 border-sand-300 focus:border-forest-500 focus:ring-forest-500 bg-white ${
                    errors.firstName ? 'border-earth-500 ring-1 ring-earth-500' : ''
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-sm text-earth-600 flex items-center gap-1 font-body">
                    <span className="w-1 h-1 rounded-full bg-earth-500" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-forest-700 font-medium font-body">
                  Last Name <span className="text-earth-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className={`mt-1.5 border-sand-300 focus:border-forest-500 focus:ring-forest-500 bg-white ${
                    errors.lastName ? 'border-earth-500 ring-1 ring-earth-500' : ''
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-sm text-earth-600 flex items-center gap-1 font-body">
                    <span className="w-1 h-1 rounded-full bg-earth-500" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-forest-700 font-medium font-body">
                Email Address
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="border-sand-200 bg-sand-50 text-forest-400 cursor-not-allowed pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-forest-400 bg-white/50 px-2 py-0.5 rounded font-body">
                  Verified
                </span>
              </div>
              <p className="mt-1.5 text-xs text-forest-500 font-body">
                Email can be changed in account settings after onboarding
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sand-500 to-sand-300" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center group-hover:bg-sand-200 transition-colors">
                <Phone className="w-6 h-6 text-sand-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-forest-800 text-lg">Contact & Location</h3>
                <p className="text-sm text-forest-500 font-body">How to reach you</p>
              </div>
              {(formData.phone || formData.location) && (
                <CheckCircle2 className="w-5 h-5 text-sand-500 ml-auto" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-forest-700 font-medium font-body">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`mt-1.5 border-sand-300 focus:border-sand-500 focus:ring-sand-500 bg-white ${
                    errors.phone ? 'border-earth-500 ring-1 ring-earth-500' : ''
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-earth-600 flex items-center gap-1 font-body">
                    <span className="w-1 h-1 rounded-full bg-earth-500" />
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="location" className="text-forest-700 font-medium flex items-center gap-2 font-body">
                  <MapPin className="w-4 h-4 text-forest-400" />
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State/Country"
                  className="mt-1.5 border-sand-300 focus:border-sand-500 focus:ring-sand-500 bg-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone" className="text-forest-700 font-medium flex items-center gap-2 font-body">
                <Clock className="w-4 h-4 text-forest-400" />
                Timezone
              </Label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-sand-300 bg-white px-3 py-2.5 text-forest-700 focus:border-sand-500 focus:outline-none focus:ring-2 focus:ring-sand-200 font-body"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-forest-500 flex items-center gap-1 font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse" />
                Auto-detected from your browser
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-earth-400 to-earth-300" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-earth-100 flex items-center justify-center group-hover:bg-earth-200 transition-colors">
                <FileText className="w-6 h-6 text-earth-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-forest-800 text-lg">About You</h3>
                <p className="text-sm text-forest-500 font-body">Share your story with the community</p>
              </div>
              {formData.bio && (
                <CheckCircle2 className="w-5 h-5 text-earth-500 ml-auto" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="bio" className="text-forest-700 font-medium font-body">
                Bio
              </Label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Share a bit about yourself, your background, and what brings you to BRITE POOL..."
                rows={4}
                maxLength={500}
                className="mt-1.5 w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-forest-700 placeholder:text-forest-400 focus:border-earth-400 focus:outline-none focus:ring-2 focus:ring-earth-200 resize-none font-body"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-forest-500 font-body">
                  Help others get to know you better
                </p>
                <p className={`text-xs font-medium font-body ${formData.bio.length > 450 ? 'text-earth-600' : 'text-forest-500'}`}>
                  {formData.bio.length}/500
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="border-2 border-forest-600 text-forest-700 hover:bg-forest-600 hover:text-white font-semibold px-6 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-gradient-to-r from-forest-700 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
