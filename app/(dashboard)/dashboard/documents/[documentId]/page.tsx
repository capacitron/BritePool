'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, ArrowLeft, Edit, Trash2, Calendar, HardDrive, User, Clock } from 'lucide-react'
import { isAdmin } from '@/lib/auth/roles'
import { UserRole } from '@prisma/client'

interface Document {
  id: string
  title: string
  description: string | null
  category: string
  fileUrl: string
  fileType: string
  fileSize: number
  mimeType: string
  version: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  uploadedBy: {
    id: string
    name: string
    role: string
  }
}

const categoryColors: Record<string, string> = {
  GOVERNANCE: 'bg-purple-100 text-purple-800 border-purple-200',
  FINANCIAL: 'bg-green-100 text-green-800 border-green-200',
  LEGAL: 'bg-blue-100 text-blue-800 border-blue-200',
  EDUCATIONAL: 'bg-amber-100 text-amber-800 border-amber-200',
  OPERATIONAL: 'bg-teal-100 text-teal-800 border-teal-200',
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function DocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const userIsAdmin = session?.user?.role ? isAdmin(session.user.role as UserRole) : false

  useEffect(() => {
    fetchDocument()
  }, [documentId])

  async function fetchDocument() {
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}`)
      if (res.ok) {
        const data = await res.json()
        setDocument(data)
      } else if (res.status === 404) {
        router.push('/dashboard/documents')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/documents')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-earth-brown"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-earth-brown-light">Document not found</p>
        <Link href="/dashboard/documents" className="text-earth-brown hover:underline mt-2 inline-block">
          Back to Documents
        </Link>
      </div>
    )
  }

  const isPdf = document.mimeType === 'application/pdf'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/documents" 
          className="p-2 hover:bg-stone-warm rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-earth-brown" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            {document.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm border ${categoryColors[document.category]}`}>
              {document.category}
            </span>
            <span className="text-sm text-earth-brown-light">
              Version {document.version}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-earth-brown text-white rounded-lg hover:bg-earth-brown-dark transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
          {userIsAdmin && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isPdf ? (
            <Card>
              <CardHeader>
                <CardTitle>Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/5] bg-stone-warm rounded-lg overflow-hidden">
                  <iframe
                    src={document.fileUrl}
                    className="w-full h-full"
                    title={document.title}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-earth-brown-light mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-earth-brown-dark mb-2">
                  Preview Not Available
                </h3>
                <p className="text-earth-brown-light mb-4">
                  This file type ({document.fileType}) cannot be previewed in the browser.
                </p>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-earth-brown text-white rounded-lg hover:bg-earth-brown-dark transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download to View
                </a>
              </CardContent>
            </Card>
          )}

          {document.description && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-earth-brown">{document.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-earth-brown-light" />
                <div>
                  <p className="text-sm text-earth-brown-light">File Type</p>
                  <p className="font-medium text-earth-brown-dark uppercase">{document.fileType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-earth-brown-light" />
                <div>
                  <p className="text-sm text-earth-brown-light">File Size</p>
                  <p className="font-medium text-earth-brown-dark">{formatFileSize(document.fileSize)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-earth-brown-light" />
                <div>
                  <p className="text-sm text-earth-brown-light">Uploaded By</p>
                  <p className="font-medium text-earth-brown-dark">{document.uploadedBy.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-earth-brown-light" />
                <div>
                  <p className="text-sm text-earth-brown-light">Created</p>
                  <p className="font-medium text-earth-brown-dark">{formatDate(document.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-earth-brown-light" />
                <div>
                  <p className="text-sm text-earth-brown-light">Last Updated</p>
                  <p className="font-medium text-earth-brown-dark">{formatDate(document.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-stone-warm rounded-lg">
                  <div className="w-2 h-2 bg-earth-brown rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-earth-brown-dark">
                      Version {document.version}
                    </p>
                    <p className="text-xs text-earth-brown-light">
                      {formatDate(document.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs bg-earth-brown text-white px-2 py-1 rounded">
                    Current
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showEditModal && document && (
        <EditModal 
          document={document}
          onClose={() => setShowEditModal(false)} 
          onSuccess={() => {
            setShowEditModal(false)
            fetchDocument()
          }}
        />
      )}
    </div>
  )
}

function EditModal({ 
  document, 
  onClose, 
  onSuccess 
}: { 
  document: Document
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    title: document.title,
    description: document.description || '',
    category: document.category,
    version: document.version,
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update document')
      }
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Failed to update document')
    } finally {
      setSubmitting(false)
    }
  }

  const CATEGORIES = [
    { value: 'GOVERNANCE', label: 'Governance' },
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'EDUCATIONAL', label: 'Educational' },
    { value: 'OPERATIONAL', label: 'Operational' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-earth-brown-dark mb-4">Edit Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-brown-dark mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-brown"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-brown-dark mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-brown"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-brown-dark mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-brown"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-brown-dark mb-1">Version</label>
            <input
              type="text"
              required
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full px-3 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-earth-brown"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="flex-1 bg-earth-brown hover:bg-earth-brown-dark"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
