'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Upload, Filter, Folder, Calendar, HardDrive } from 'lucide-react'
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
  createdAt: string
  uploadedBy: {
    id: string
    name: string
  }
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'GOVERNANCE', label: 'Governance' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'EDUCATIONAL', label: 'Educational' },
  { value: 'OPERATIONAL', label: 'Operational' },
]

const categoryColors: Record<string, string> = {
  GOVERNANCE: 'bg-forest-100 text-forest-800 border-forest-200',
  FINANCIAL: 'bg-forest-100 text-forest-700 border-forest-200',
  LEGAL: 'bg-sand-200 text-sand-800 border-sand-300',
  EDUCATIONAL: 'bg-earth-100 text-earth-800 border-earth-200',
  OPERATIONAL: 'bg-forest-100 text-forest-700 border-forest-200',
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
    month: 'short',
    day: 'numeric'
  })
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)

  const userIsAdmin = session?.user?.role ? isAdmin(session.user.role as UserRole) : false

  useEffect(() => {
    fetchDocuments()
  }, [selectedCategory])

  async function fetchDocuments() {
    setLoading(true)
    try {
      const url = selectedCategory
        ? `/api/documents?category=${selectedCategory}`
        : '/api/documents'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = []
    }
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-forest-800">
            Document Library
          </h1>
          <p className="text-forest-500 mt-1 font-body">
            Access and manage organizational documents
          </p>
        </div>
        {userIsAdmin && (
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-forest-600 hover:bg-forest-700 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      <Card className="border-sand-200">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-forest-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mx-auto"></div>
          <p className="text-forest-500 mt-4 font-body">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-sand-200">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-forest-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-display text-forest-800 mb-2">
              No Documents Found
            </h3>
            <p className="text-forest-500 font-body">
              {selectedCategory
                ? 'No documents in this category yet.'
                : 'No documents have been uploaded yet.'}
            </p>
          </CardContent>
        </Card>
      ) : selectedCategory ? (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        Object.entries(groupedDocuments).map(([category, docs]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-forest-600" />
              <h2 className="text-xl font-semibold font-display text-forest-800">
                {category.charAt(0) + category.slice(1).toLowerCase()}
              </h2>
              <span className="text-sm text-forest-500 font-body">({docs.length})</span>
            </div>
            <div className="grid gap-4">
              {docs.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        ))
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchDocuments()
          }}
        />
      )}
    </div>
  )
}

function DocumentCard({ document }: { document: Document }) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-sand-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sand-100 rounded-lg">
              <FileText className="h-6 w-6 text-forest-600" />
            </div>
            <div>
              <Link
                href={`/dashboard/documents/${document.id}`}
                className="text-lg font-semibold font-display text-forest-800 hover:text-forest-600"
              >
                {document.title}
              </Link>
              <div className="flex items-center gap-4 text-sm text-forest-500 mt-1 font-body">
                <span className={`px-2 py-0.5 rounded-full text-xs border ${categoryColors[document.category]}`}>
                  {document.category}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {formatFileSize(document.fileSize)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(document.createdAt)}
                </span>
                <span className="uppercase text-xs font-medium">
                  {document.fileType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-forest-600 hover:bg-sand-100 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GOVERNANCE',
    fileUrl: '',
    fileType: 'PDF',
    fileSize: 0,
    mimeType: 'application/pdf',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold font-display text-forest-800 mb-4">Upload Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1 font-body">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1 font-body">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1 font-body">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
            >
              {CATEGORIES.slice(1).map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1 font-body">File URL</label>
            <input
              type="url"
              required
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1 font-body">File Type</label>
              <input
                type="text"
                required
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1 font-body">File Size (bytes)</label>
              <input
                type="number"
                required
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-forest-600 text-forest-700 hover:bg-forest-50">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-forest-600 hover:bg-forest-700 text-white"
            >
              {submitting ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
