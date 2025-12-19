'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    phone: '',
    location: '',
    timezone: 'UTC',
  })

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const matchedTimezone = timezones.find((tz) => tz.value === detectedTimezone)
    if (matchedTimezone) {
      setFormData((prev) => ({ ...prev, timezone: matchedTimezone.value }))
    }
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2, profile: formData }),
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

  return (
    <div className="space-y-8">
      <Card className="border-earth-brown-light/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-earth-brown-dark">
            Set Up Your Profile
          </CardTitle>
          <CardDescription className="text-earth-brown-light">
            Help us personalize your experience. All fields are optional but recommended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-earth-brown-light/20 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-12 h-12 text-earth-brown-light"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-sm text-earth-brown-light">
              Avatar upload available in your dashboard settings
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bio" className="text-earth-brown-dark">
                Bio
              </Label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a bit about yourself..."
                rows={4}
                className="mt-1 w-full rounded-md border border-earth-brown-light/30 bg-white px-3 py-2 text-earth-brown placeholder:text-earth-brown-light/50 focus:border-earth-gold focus:outline-none focus:ring-1 focus:ring-earth-gold"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-earth-brown-dark">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 border-earth-brown-light/30 focus:border-earth-gold focus:ring-earth-gold"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-earth-brown-dark">
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="mt-1 border-earth-brown-light/30 focus:border-earth-gold focus:ring-earth-gold"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone" className="text-earth-brown-dark">
                Timezone
              </Label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-earth-brown-light/30 bg-white px-3 py-2 text-earth-brown focus:border-earth-gold focus:outline-none focus:ring-1 focus:ring-earth-gold"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          className="border-earth-brown-dark border-2 text-earth-brown-dark hover:bg-earth-brown-dark hover:text-white font-semibold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-earth-brown-dark hover:bg-earth-brown text-white px-8 font-semibold shadow-lg"
        >
          {isLoading ? 'Saving...' : 'Continue'}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Button>
      </div>
    </div>
  )
}
