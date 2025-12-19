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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-earth-brown-dark via-earth-brown to-earth-brown-dark p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='20' fill='none' stroke='%23fff' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='10' fill='none' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-earth-gold/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-sage/15 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-earth-gold to-transparent" />
              <span className="text-earth-gold text-sm font-medium uppercase tracking-wider">Step 2 of 4</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Create Your Profile</h1>
            <p className="text-white/70 max-w-md">Tell us about yourself to personalize your BRITE POOL experience</p>
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
                  stroke="#C9A227"
                  strokeWidth="6"
                  strokeDasharray={`${percentage * 2.51} 251`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{percentage}%</span>
              </div>
            </div>
            <span className="text-white/60 text-xs mt-2">Complete</span>
          </div>
        </div>
      </div>

      {/* Avatar Section */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-stone-warm/50 to-earth-light/50 p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-earth-gold to-earth-gold-dark rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-white to-stone-warm rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <span className="text-4xl font-serif font-bold text-earth-brown-dark">
                  {formData.firstName.charAt(0).toUpperCase() || '?'}
                  {formData.lastName.charAt(0).toUpperCase() || ''}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-earth-gold rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-serif font-bold text-earth-brown-dark">
                {formData.firstName || formData.lastName
                  ? `${formData.firstName} ${formData.lastName}`.trim()
                  : 'Your Name'}
              </h3>
              <p className="text-earth-brown-light text-sm mt-1">New BRITE POOL Member</p>
              <p className="text-earth-brown-light/60 text-xs mt-2">
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
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sage to-sage/50" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center group-hover:bg-sage/20 transition-colors">
                <User className="w-6 h-6 text-sage" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-earth-brown-dark text-lg">Personal Information</h3>
                <p className="text-sm text-earth-brown-light">Your name and identity</p>
              </div>
              {formData.firstName && formData.lastName && (
                <CheckCircle2 className="w-5 h-5 text-sage ml-auto" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-earth-brown-dark font-medium">
                  First Name <span className="text-terracotta">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className={`mt-1.5 border-earth-brown-light/30 focus:border-sage focus:ring-sage bg-white ${
                    errors.firstName ? 'border-terracotta ring-1 ring-terracotta' : ''
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-sm text-terracotta flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-terracotta" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-earth-brown-dark font-medium">
                  Last Name <span className="text-terracotta">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className={`mt-1.5 border-earth-brown-light/30 focus:border-sage focus:ring-sage bg-white ${
                    errors.lastName ? 'border-terracotta ring-1 ring-terracotta' : ''
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-sm text-terracotta flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-terracotta" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-earth-brown-dark font-medium">
                Email Address
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="border-earth-brown-light/20 bg-stone-warm/30 text-earth-brown-light cursor-not-allowed pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-earth-brown-light/60 bg-white/50 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <p className="mt-1.5 text-xs text-earth-brown-light">
                Email can be changed in account settings after onboarding
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-soft to-sky-soft/50" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-soft/10 flex items-center justify-center group-hover:bg-sky-soft/20 transition-colors">
                <Phone className="w-6 h-6 text-sky-soft" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-earth-brown-dark text-lg">Contact & Location</h3>
                <p className="text-sm text-earth-brown-light">How to reach you</p>
              </div>
              {(formData.phone || formData.location) && (
                <CheckCircle2 className="w-5 h-5 text-sky-soft ml-auto" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-earth-brown-dark font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`mt-1.5 border-earth-brown-light/30 focus:border-sky-soft focus:ring-sky-soft bg-white ${
                    errors.phone ? 'border-terracotta ring-1 ring-terracotta' : ''
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-terracotta flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-terracotta" />
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="location" className="text-earth-brown-dark font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-earth-brown-light" />
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State/Country"
                  className="mt-1.5 border-earth-brown-light/30 focus:border-sky-soft focus:ring-sky-soft bg-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone" className="text-earth-brown-dark font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-earth-brown-light" />
                Timezone
              </Label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-earth-brown-light/30 bg-white px-3 py-2.5 text-earth-brown focus:border-sky-soft focus:outline-none focus:ring-2 focus:ring-sky-soft/20"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-earth-brown-light flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                Auto-detected from your browser
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-earth-gold to-earth-gold/50" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-earth-gold/10 flex items-center justify-center group-hover:bg-earth-gold/20 transition-colors">
                <FileText className="w-6 h-6 text-earth-gold-dark" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-earth-brown-dark text-lg">About You</h3>
                <p className="text-sm text-earth-brown-light">Share your story with the community</p>
              </div>
              {formData.bio && (
                <CheckCircle2 className="w-5 h-5 text-earth-gold ml-auto" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="bio" className="text-earth-brown-dark font-medium">
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
                className="mt-1.5 w-full rounded-lg border border-earth-brown-light/30 bg-white px-4 py-3 text-earth-brown placeholder:text-earth-brown-light/50 focus:border-earth-gold focus:outline-none focus:ring-2 focus:ring-earth-gold/20 resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-earth-brown-light">
                  Help others get to know you better
                </p>
                <p className={`text-xs font-medium ${formData.bio.length > 450 ? 'text-terracotta' : 'text-earth-brown-light'}`}>
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
          className="border-2 border-earth-brown-dark text-earth-brown-dark hover:bg-earth-brown-dark hover:text-white font-semibold px-6 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-gradient-to-r from-earth-brown-dark to-earth-brown hover:from-earth-brown hover:to-earth-brown-dark text-white px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
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
