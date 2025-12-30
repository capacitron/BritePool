'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  COMMUNAL_SEAT_CATEGORY_LABELS,
  COMMUNAL_SEAT_CATEGORY_COLORS,
  COMMUNAL_SEAT_CATEGORY_DESCRIPTIONS,
  COMMUNAL_SEAT_CATEGORIES
} from '@/lib/communal-seat/categories'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react'

interface SubmissionFormProps {
  onSuccess?: () => void
}

export function SubmissionForm({ onSuccess }: SubmissionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    serviceDescription: '',
    yearsExperience: 0,
    certifications: '',
    websiteLink: '',
    motivation: '',
    documentUrl: '',
    documentFileName: '',
    categories: [] as string[],
  })

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate categories
      if (formData.categories.length === 0) {
        throw new Error('Please select at least one service category')
      }

      // Validate document
      if (!formData.documentUrl) {
        throw new Error('Please upload your PDF document')
      }

      const response = await fetch('/api/communal-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          yearsExperience: Number(formData.yearsExperience),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit application')
      }

      setSuccess(true)
      onSuccess?.()

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/communal-seat')
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Simulated file upload (in real app, this would upload to storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB')
      return
    }

    // In a real app, this would upload to cloud storage
    // For now, we'll create a mock URL
    const mockUrl = `https://storage.example.com/documents/${Date.now()}-${file.name}`

    setFormData(prev => ({
      ...prev,
      documentUrl: mockUrl,
      documentFileName: file.name,
    }))
    setError(null)
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-forest-900 mb-2">Application Submitted!</h2>
        <p className="text-forest-600">
          Your communal seat application has been submitted for review.
          You will be notified once it has been processed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Service Categories */}
      <div>
        <h3 className="text-lg font-semibold text-forest-900 mb-3">Service Categories *</h3>
        <p className="text-sm text-forest-600 mb-4">Select all categories that apply to your service offerings</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNAL_SEAT_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryToggle(category)}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                formData.categories.includes(category)
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  COMMUNAL_SEAT_CATEGORY_COLORS[category]
                )}>
                  {COMMUNAL_SEAT_CATEGORY_LABELS[category]}
                </span>
                {formData.categories.includes(category) && (
                  <CheckCircle className="h-5 w-5 text-gold-500" />
                )}
              </div>
              <p className="text-xs text-forest-500 mt-1">
                {COMMUNAL_SEAT_CATEGORY_DESCRIPTIONS[category]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-forest-900">Personal Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="Enter your full legal name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Years of Experience *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.yearsExperience}
              onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-forest-900">Service Details</h3>

        <div>
          <label className="block text-sm font-medium text-forest-700 mb-1">Service Description *</label>
          <textarea
            required
            rows={4}
            value={formData.serviceDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            placeholder="Describe the services you can provide to the community..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Certifications / Licenses</label>
            <input
              type="text"
              value={formData.certifications}
              onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="List any relevant certifications"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Website / Portfolio</label>
            <input
              type="url"
              value={formData.websiteLink}
              onChange={(e) => setFormData(prev => ({ ...prev, websiteLink: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-forest-700 mb-1">Why do you want to participate? *</label>
          <textarea
            required
            rows={4}
            value={formData.motivation}
            onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            placeholder="Share your motivation for joining the Ministerial Marketplace..."
          />
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <h3 className="text-lg font-semibold text-forest-900 mb-3">Supporting Document *</h3>
        <p className="text-sm text-forest-600 mb-4">Upload a PDF document with additional information about your qualifications (max 10MB)</p>

        {formData.documentFileName ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">{formData.documentFileName}</p>
              <p className="text-sm text-green-600">Document uploaded successfully</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, documentUrl: '', documentFileName: '' }))}
              className="p-1 hover:bg-green-100 rounded"
            >
              <X className="h-5 w-5 text-green-600" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold-400 hover:bg-gold-50 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to upload PDF document</span>
            <span className="text-xs text-gray-400 mt-1">PDF only, max 10MB</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gold-500 hover:bg-gold-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>
    </form>
  )
}
