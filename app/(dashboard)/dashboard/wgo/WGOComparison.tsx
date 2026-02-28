'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { WGO_CATEGORY_LABELS, WGO_CATEGORY_COLORS } from '@/lib/wgo/categories'
import { LayoutGrid, TableIcon, GitCompareArrows, Pencil, DollarSign, Calendar } from 'lucide-react'

interface WGO {
  id: string
  title: string
  category: string
  credibilityScore?: number | null
  minimumInvestment?: number | null
  wgoType?: string | null
  shortDescription?: string | null
  presentationDays?: string | null
}

interface MatrixRow {
  id: string
  theme: string
  sortOrder: number
  similarity: string
  difference: string
}

interface WGOComparisonProps {
  activeWGOs: WGO[]
  matrixRows: MatrixRow[]
  isAdmin: boolean
  onMatrixUpdate: (id: string, data: { similarity?: string; difference?: string }) => Promise<void>
}

type ViewMode = 'cards' | 'table' | 'matrix'

function ScoreBar({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined)
    return <span className="text-xs text-forest-400">N/A</span>
  const pct = (score / 10) * 100
  const color = score >= 7 ? 'bg-emerald-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 bg-sand-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-forest-700">{score}/10</span>
    </div>
  )
}

export default function WGOComparison({
  activeWGOs,
  matrixRows,
  isAdmin,
  onMatrixUpdate,
}: WGOComparisonProps) {
  const [view, setView] = useState<ViewMode>('cards')
  const [editRow, setEditRow] = useState<MatrixRow | null>(null)
  const [editSimilarity, setEditSimilarity] = useState('')
  const [editDifference, setEditDifference] = useState('')
  const [saving, setSaving] = useState(false)

  const sortedWGOs = [...activeWGOs].sort(
    (a, b) => (b.credibilityScore ?? 0) - (a.credibilityScore ?? 0)
  )

  const handleEditOpen = (row: MatrixRow) => {
    setEditRow(row)
    setEditSimilarity(row.similarity)
    setEditDifference(row.difference)
  }

  const handleEditSave = async () => {
    if (!editRow) return
    setSaving(true)
    try {
      await onMatrixUpdate(editRow.id, {
        similarity: editSimilarity,
        difference: editDifference,
      })
      setEditRow(null)
    } finally {
      setSaving(false)
    }
  }

  if (activeWGOs.length === 0) {
    return (
      <Card className="border-sand-200">
        <CardContent className="p-12 text-center">
          <GitCompareArrows className="h-12 w-12 text-forest-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-forest-700 mb-2">No Active Opportunities</h3>
          <p className="text-forest-500">Comparison view shows only ACTIVE opportunities.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === 'cards' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('cards')}
        >
          <LayoutGrid className="h-4 w-4 mr-1" />
          Cards
        </Button>
        <Button
          variant={view === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('table')}
        >
          <TableIcon className="h-4 w-4 mr-1" />
          Table
        </Button>
        <Button
          variant={view === 'matrix' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('matrix')}
        >
          <GitCompareArrows className="h-4 w-4 mr-1" />
          Matrix
        </Button>
      </div>

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWGOs.map((wgo) => (
            <Card key={wgo.id} className="border-sand-200">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-forest-800">{wgo.title}</h3>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full whitespace-nowrap',
                      WGO_CATEGORY_COLORS[wgo.category] || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {WGO_CATEGORY_LABELS[wgo.category] || wgo.category}
                  </span>
                </div>

                <ScoreBar score={wgo.credibilityScore} />

                {wgo.minimumInvestment !== null && (
                  <div className="flex items-center gap-1.5 text-sm text-forest-600">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Entry: ${wgo.minimumInvestment}</span>
                  </div>
                )}

                {wgo.wgoType && (
                  <p className="text-xs text-forest-500">
                    <span className="font-medium">Payment:</span> {wgo.wgoType}
                  </p>
                )}

                {wgo.shortDescription && (
                  <p className="text-xs text-forest-500">
                    <span className="font-medium">Revenue:</span> {wgo.shortDescription}
                  </p>
                )}

                {wgo.presentationDays && (
                  <div className="flex items-center gap-1.5 text-xs text-forest-500">
                    <Calendar className="h-3 w-3" />
                    <span>{wgo.presentationDays}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card className="border-sand-200">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Entry Cost</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWGOs.map((wgo) => (
                  <TableRow key={wgo.id}>
                    <TableCell className="font-medium">{wgo.title}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          WGO_CATEGORY_COLORS[wgo.category] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {WGO_CATEGORY_LABELS[wgo.category] || wgo.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ScoreBar score={wgo.credibilityScore} />
                    </TableCell>
                    <TableCell>
                      {wgo.minimumInvestment !== null ? `$${wgo.minimumInvestment}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{wgo.wgoType || '—'}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {wgo.presentationDays || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Matrix View */}
      {view === 'matrix' && (
        <div className="space-y-4">
          {matrixRows.map((row) => (
            <Card key={row.id} className="border-sand-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-forest-800">{row.theme}</h3>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => handleEditOpen(row)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Similarities</p>
                    <p className="text-sm text-emerald-900">{row.similarity}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs font-medium text-amber-700 mb-1">Differences</p>
                    <p className="text-sm text-amber-900">{row.difference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {matrixRows.length === 0 && (
            <Card className="border-sand-200">
              <CardContent className="p-8 text-center text-forest-500">
                No comparison data available yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Matrix Dialog */}
      {editRow && (
        <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit: {editRow.theme}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Similarities
                </label>
                <textarea
                  value={editSimilarity}
                  onChange={(e) => setEditSimilarity(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Differences
                </label>
                <textarea
                  value={editDifference}
                  onChange={(e) => setEditDifference(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
