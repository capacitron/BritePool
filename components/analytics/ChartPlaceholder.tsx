'use client'

import { cn } from '@/lib/utils'
import { BarChart2, LineChart, PieChart, TrendingUp } from 'lucide-react'

type ChartType = 'bar' | 'line' | 'pie' | 'area'

interface ChartPlaceholderProps {
  title: string
  description?: string
  type?: ChartType
  height?: string
  className?: string
}

const chartIcons: Record<ChartType, typeof BarChart2> = {
  bar: BarChart2,
  line: LineChart,
  pie: PieChart,
  area: TrendingUp,
}

export function ChartPlaceholder({
  title,
  description,
  type = 'bar',
  height = 'h-64',
  className,
}: ChartPlaceholderProps) {
  const Icon = chartIcons[type]

  return (
    <div className={cn('', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-earth-dark">{title}</h3>
        {description && (
          <p className="text-sm text-earth-brown-light mt-1">{description}</p>
        )}
      </div>
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone bg-stone-warm/30',
          height
        )}
      >
        <Icon className="h-12 w-12 text-earth-brown-light/50 mb-3" />
        <p className="text-sm text-earth-brown-light font-medium">Chart Coming Soon</p>
        <p className="text-xs text-earth-brown-light/70 mt-1">
          Interactive {type} chart will be displayed here
        </p>
      </div>
    </div>
  )
}
