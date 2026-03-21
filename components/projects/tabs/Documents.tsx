'use client'

import type { ProjectDocument } from '@/lib/projects/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, ExternalLink } from 'lucide-react'

interface DocumentsProps {
  documents: ProjectDocument[]
}

export function Documents({ documents }: DocumentsProps) {
  return (
    <Card className="border-sand-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <FileText className="h-5 w-5 text-forest-600" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-bark/60 font-body py-8 text-center">
            No documents have been added to this project yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-forest-700">Title</TableHead>
                <TableHead className="font-semibold text-forest-700">Type</TableHead>
                <TableHead className="font-semibold text-forest-700">Link</TableHead>
                <TableHead className="font-semibold text-forest-700">Date Added</TableHead>
                <TableHead className="font-semibold text-forest-700">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium font-body">{doc.title}</TableCell>
                  <TableCell className="font-body">
                    <span className="inline-flex items-center rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-medium text-forest-700">
                      {doc.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-body">
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-earth-500 hover:text-earth-600 text-sm"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-bark/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-body">{doc.dateAdded}</TableCell>
                  <TableCell className="font-body text-bark/60">{doc.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
