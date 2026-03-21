'use client'

import type { ProjectMedia } from '@/lib/projects/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Image as ImageIcon, ExternalLink } from 'lucide-react'

interface MediaProps {
  media: ProjectMedia[]
}

export function Media({ media }: MediaProps) {
  return (
    <Card className="border-sand-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <ImageIcon className="h-5 w-5 text-forest-600" />
          Media
        </CardTitle>
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <p className="text-sm text-bark/60 font-body py-8 text-center">
            No media has been added to this project yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-sand-200 overflow-hidden bg-sand-50"
              >
                <div className="aspect-video bg-sand-100 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-sand-300" />
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-medium font-body text-sm text-forest-800">{item.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="inline-flex items-center rounded-full bg-sand-100 px-2 py-0.5 text-xs font-medium text-forest-700">
                      {item.type}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-earth-500 hover:text-earth-600 text-xs"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-bark/60 font-body mt-2">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
