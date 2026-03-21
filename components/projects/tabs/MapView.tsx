'use client'

import type { MapLocation } from '@/lib/projects/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MapPin } from 'lucide-react'

interface MapViewProps {
  locations: MapLocation[]
}

export function MapView({ locations }: MapViewProps) {
  return (
    <div className="space-y-4">
      <Card className="border-sand-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-forest-800">
            <MapPin className="h-5 w-5 text-forest-600" />
            Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-sand-200 bg-sand-50 h-64 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-10 w-10 text-sand-300 mx-auto mb-2" />
              <p className="text-sm text-bark/60 font-body">
                Interactive map integration coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {locations.length > 0 && (
        <Card className="border-sand-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-display text-forest-800">Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-forest-700">Location Name</TableHead>
                  <TableHead className="font-semibold text-forest-700">
                    Address / Coordinates
                  </TableHead>
                  <TableHead className="font-semibold text-forest-700">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium font-body">{location.name}</TableCell>
                    <TableCell className="font-body">
                      {location.address ||
                        (location.coordinates
                          ? `${location.coordinates.lat}, ${location.coordinates.lng}`
                          : '—')}
                    </TableCell>
                    <TableCell className="font-body text-bark/60">
                      {location.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {locations.length === 0 && (
        <p className="text-sm text-bark/60 font-body text-center py-4">
          No locations have been added to this project yet.
        </p>
      )}
    </div>
  )
}
