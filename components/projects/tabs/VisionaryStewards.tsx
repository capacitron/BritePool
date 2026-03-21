'use client'

import type { VisionarySteward } from '@/lib/projects/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users } from 'lucide-react'

interface VisionaryStewardsProps {
  stewards: VisionarySteward[]
}

export function VisionaryStewards({ stewards }: VisionaryStewardsProps) {
  return (
    <Card className="border-sand-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <Users className="h-5 w-5 text-forest-600" />
          Visionary Stewards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stewards.length === 0 ? (
          <p className="text-sm text-bark/60 font-body py-8 text-center">
            No stewards have been added to this project yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-forest-700">Name</TableHead>
                <TableHead className="font-semibold text-forest-700">Role</TableHead>
                <TableHead className="font-semibold text-forest-700">Contact</TableHead>
                <TableHead className="font-semibold text-forest-700">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stewards.map((steward) => (
                <TableRow key={steward.id}>
                  <TableCell className="font-medium font-body">{steward.name}</TableCell>
                  <TableCell className="font-body">{steward.role}</TableCell>
                  <TableCell className="font-body">{steward.contact}</TableCell>
                  <TableCell className="font-body text-bark/60">{steward.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
