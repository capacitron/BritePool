'use client'

import { getPageDescription } from '@/lib/page-descriptions'
import { Info } from 'lucide-react'

interface PageHeaderProps {
  path: string
  customTitle?: string
  customDescription?: string
  showTerms?: boolean
}

export function PageHeader({ path, customTitle, customDescription, showTerms = true }: PageHeaderProps) {
  const pageDesc = getPageDescription(path)

  if (!pageDesc && !customTitle) {
    return null
  }

  const title = customTitle || pageDesc?.title
  const description = customDescription || pageDesc?.description
  const terms = pageDesc?.terms

  return (
    <div className="bg-gradient-to-r from-forest-50 to-gold-50 border-b border-forest-100 px-6 py-5 mb-6 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Info className="h-5 w-5 text-forest-600" />
        </div>
        <div className="flex-1">
          {title && (
            <h1 className="text-xl font-bold text-forest-900 mb-1">{title}</h1>
          )}
          {description && (
            <p className="text-forest-600 text-sm leading-relaxed">{description}</p>
          )}
          {showTerms && terms && terms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {terms.map((term, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-forest-700 border border-forest-200"
                >
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
