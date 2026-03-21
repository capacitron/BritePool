'use client'

import type { BudgetItem } from '@/lib/projects/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { DollarSign } from 'lucide-react'

interface BudgetProps {
  items: BudgetItem[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-forest-100 text-forest-700'
    case 'in progress':
      return 'bg-sand-200 text-sand-800'
    case 'planned':
      return 'bg-sand-100 text-bark/70'
    case 'over budget':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-sand-100 text-bark/70'
  }
}

export function Budget({ items }: BudgetProps) {
  const totalEstimated = items.reduce((sum, item) => sum + item.estimatedCost, 0)
  const totalActual = items.reduce((sum, item) => sum + item.actualCost, 0)
  const variance = totalEstimated - totalActual

  return (
    <Card className="border-sand-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <DollarSign className="h-5 w-5 text-forest-600" />
          Budget
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-bark/60 font-body py-8 text-center">
            No budget items have been added to this project yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-forest-700">Category</TableHead>
                  <TableHead className="font-semibold text-forest-700 text-right">
                    Estimated
                  </TableHead>
                  <TableHead className="font-semibold text-forest-700 text-right">Actual</TableHead>
                  <TableHead className="font-semibold text-forest-700">Status</TableHead>
                  <TableHead className="font-semibold text-forest-700">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium font-body">{item.category}</TableCell>
                    <TableCell className="font-body text-right tabular-nums">
                      {formatCurrency(item.estimatedCost)}
                    </TableCell>
                    <TableCell className="font-body text-right tabular-nums">
                      {formatCurrency(item.actualCost)}
                    </TableCell>
                    <TableCell className="font-body">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-body text-bark/60">{item.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-forest-50 font-semibold">
                  <TableCell className="font-display text-forest-800">Totals</TableCell>
                  <TableCell className="text-right tabular-nums font-body">
                    {formatCurrency(totalEstimated)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-body">
                    {formatCurrency(totalActual)}
                  </TableCell>
                  <TableCell className="font-body">
                    <span
                      className={`text-sm ${variance >= 0 ? 'text-forest-600' : 'text-red-600'}`}
                    >
                      {variance >= 0 ? 'Under' : 'Over'} by {formatCurrency(Math.abs(variance))}
                    </span>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
