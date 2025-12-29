'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, formatDate } from '@/lib/utils'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Loader2,
  File,
  FileSpreadsheet,
  FileImage,
  FolderOpen,
  X,
  ExternalLink,
} from 'lucide-react'

interface CommitteeDocument {
  id: string
  title: string
  description: string | null
  category: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  version: string
  createdAt: string
  uploadedBy: {
    id: string
    name: string
  }
}

interface CommitteeDocumentsProps {
  committeeId: string
  currentUserId: string
  isLeader: boolean
}

const DOCUMENT_CATEGORIES = [
  { id: 'GOVERNANCE', label: 'Governance', color: 'bg-forest-100 text-forest-800' },
  { id: 'FINANCIAL', label: 'Financial', color: 'bg-earth-100 text-earth-800' },
  { id: 'LEGAL', label: 'Legal', color: 'bg-sand-200 text-sand-800' },
  { id: 'EDUCATIONAL', label: 'Educational', color: 'bg-forest-50 text-forest-700' },
  { id: 'OPERATIONAL', label: 'Operational', color: 'bg-sand-100 text-sand-700' },
]

export function CommitteeDocuments({ committeeId, currentUserId, isLeader }: CommitteeDocumentsProps) {
  const [documents, setDocuments] = useState<CommitteeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GOVERNANCE',
    fileUrl: '',
    fileName: '',
    fileType: '',
    fileSize: 0,
  })

  useEffect(() => {
    fetchDocuments()
  }, [committeeId, activeFilter])

  async function fetchDocuments() {
    setLoading(true)
    try {
      const url = activeFilter
        ? `/api/committees/${committeeId}/documents?category=${activeFilter}`
        : `/api/committees/${committeeId}/documents`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.fileUrl) return

    setUploading(true)
    try {
      const res = await fetch(`/api/committees/${committeeId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await fetchDocuments()
        setShowUploadModal(false)
        setFormData({
          title: '',
          description: '',
          category: 'GOVERNANCE',
          fileUrl: '',
          fileName: '',
          fileType: '',
          fileSize: 0,
        })
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await fetch(`/api/committees/${committeeId}/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId))
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  function getFileIcon(fileType: string) {
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-forest-500" />
    if (fileType.includes('spreadsheet') || fileType.includes('excel'))
      return <FileSpreadsheet className="h-8 w-8 text-forest-500" />
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-earth-500" />
    return <File className="h-8 w-8 text-forest-500" />
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filteredDocuments = activeFilter
    ? documents.filter((d) => d.category === activeFilter)
    : documents

  return (
    <>
      <Card className="border-sand-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <FolderOpen className="h-5 w-5 text-forest-500" />
              Shared Documents
            </CardTitle>
            <Button
              onClick={() => setShowUploadModal(true)}
              size="sm"
              className="bg-forest-600 hover:bg-forest-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Share Document
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setActiveFilter(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-body transition-colors',
                !activeFilter
                  ? 'bg-forest-600 text-white'
                  : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
              )}
            >
              All
            </button>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-body transition-colors',
                  activeFilter === cat.id
                    ? 'bg-forest-600 text-white'
                    : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-forest-400">
              <FolderOpen className="h-12 w-12 mb-2" />
              <p className="font-body">No documents shared yet</p>
              <p className="text-sm">Share documents to collaborate with your committee</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-sand-50 border border-sand-200"
                >
                  {getFileIcon(doc.fileType)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-forest-800 truncate font-body">
                      {doc.title}
                    </h4>
                    {doc.description && (
                      <p className="text-sm text-forest-500 line-clamp-2 font-body">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-forest-400 font-body">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full',
                        DOCUMENT_CATEGORIES.find(c => c.id === doc.category)?.color
                      )}>
                        {DOCUMENT_CATEGORIES.find(c => c.id === doc.category)?.label}
                      </span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>v{doc.version}</span>
                    </div>
                    <p className="text-xs text-forest-400 mt-1 font-body">
                      Shared by {doc.uploadedBy.name} • {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-forest-500 hover:text-forest-700 hover:bg-sand-100 rounded-lg"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {(doc.uploadedBy.id === currentUserId || isLeader) && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-forest-400 hover:text-earth-600 hover:bg-sand-100 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-forest-800">
                Share Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-forest-400 hover:text-forest-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-forest-700 font-body">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Document title"
                  required
                  className="border-sand-300 focus:border-forest-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-forest-700 font-body">Description (optional)</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the document..."
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-500 font-body text-sm"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-forest-700 font-body">Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-500 font-body"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-forest-700 font-body">File URL</Label>
                <Input
                  value={formData.fileUrl}
                  onChange={(e) => {
                    const url = e.target.value
                    const fileName = url.split('/').pop() || 'document'
                    setFormData({
                      ...formData,
                      fileUrl: url,
                      fileName,
                      fileType: fileName.split('.').pop() || 'unknown',
                      fileSize: 1024, // Placeholder size
                    })
                  }}
                  placeholder="https://example.com/document.pdf"
                  required
                  type="url"
                  className="border-sand-300 focus:border-forest-500"
                />
                <p className="text-xs text-forest-400 font-body">
                  Enter the URL of the document you want to share
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 border-forest-600 text-forest-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading || !formData.title || !formData.fileUrl}
                  className="flex-1 bg-forest-600 hover:bg-forest-700 text-white"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Share
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
