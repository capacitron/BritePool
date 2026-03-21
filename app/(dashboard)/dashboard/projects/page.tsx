import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sprout, ArrowRight } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-forest-800">Steward Projects</h1>
        <p className="text-sm text-bark/60 font-body mt-1">
          Community-driven initiatives managed by visionary stewards.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/projects/aliento-de-vida" className="group">
          <Card className="border-sand-200 hover:shadow-warm-md transition-shadow h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-forest-100 text-forest-600 group-hover:bg-forest-200 transition-colors">
                  <Sprout className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="font-display text-forest-800 text-lg">
                    Aliento De Vida
                  </CardTitle>
                  <CardDescription className="font-body">Breath of Life</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-bark/60 font-body">
                A transformative community project bringing life and renewal through stewardship and
                regenerative development.
              </p>
              <div className="flex items-center gap-1 mt-3 text-earth-500 text-sm font-medium group-hover:gap-2 transition-all">
                View Project <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
