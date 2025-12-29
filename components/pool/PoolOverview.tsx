'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PoolColorCard } from './PoolColorCard'
import { cn } from '@/lib/utils'
import { Target, TrendingUp } from 'lucide-react'

interface CutData {
  id: string
  color: 'PURPLE' | 'ORANGE' | 'GREEN'
  total: number
  pledgeCount: number
  overseerId: string
}

interface PoolOverviewProps {
  poolName: string
  goalAmount: number
  status: 'OPEN' | 'GOAL_REACHED' | 'CLOSED'
  cuts: CutData[]
  blueTotal: number
  progress: number
  userAccess: {
    isOverseer: boolean
    overseerCutId?: string
    hasAccess: boolean
    accessCutId?: string
  }
  onColorSelect: (cutId: string, color: 'PURPLE' | 'ORANGE' | 'GREEN') => void
}

export function PoolOverview({
  poolName,
  goalAmount,
  status,
  cuts,
  blueTotal,
  progress,
  userAccess,
  onColorSelect
}: PoolOverviewProps) {
  const totalPledgeCount = cuts.reduce((sum, cut) => sum + cut.pledgeCount, 0)

  // Get totals by color
  const getColorTotal = (color: 'PURPLE' | 'ORANGE' | 'GREEN') => {
    const cut = cuts.find(c => c.color === color)
    return cut ? { total: cut.total, pledgeCount: cut.pledgeCount, id: cut.id } : { total: 0, pledgeCount: 0, id: null }
  }

  const purple = getColorTotal('PURPLE')
  const orange = getColorTotal('ORANGE')
  const green = getColorTotal('GREEN')

  return (
    <div className="space-y-6">
      {/* Pool Header */}
      <Card className="border-sand-200 bg-gradient-to-br from-forest-50 to-sand-50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-display text-forest-800">
                {poolName}
              </CardTitle>
              <CardDescription className="font-body text-forest-600">
                Private stakeholder pledge pool
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-sand-200">
                <Target className="h-5 w-5 text-forest-600" />
                <div>
                  <p className="text-xs text-forest-500 font-body">Goal</p>
                  <p className="font-bold text-forest-800">${goalAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-sand-200">
                <TrendingUp className="h-5 w-5 text-earth-500" />
                <div>
                  <p className="text-xs text-forest-500 font-body">Progress</p>
                  <p className="font-bold text-forest-800">{progress.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
              {/* Stacked progress bars by color */}
              {purple.total > 0 && (
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${(purple.total / goalAmount) * 100}%` }}
                />
              )}
              {orange.total > 0 && (
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${(orange.total / goalAmount) * 100}%` }}
                />
              )}
              {green.total > 0 && (
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(green.total / goalAmount) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>${blueTotal.toLocaleString()} pledged</span>
              <span>${goalAmount.toLocaleString()} goal</span>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex justify-center mb-4">
            <span className={cn(
              'px-4 py-2 rounded-full text-sm font-medium',
              status === 'OPEN' && 'bg-green-100 text-green-700',
              status === 'GOAL_REACHED' && 'bg-blue-100 text-blue-700',
              status === 'CLOSED' && 'bg-gray-100 text-gray-700'
            )}>
              {status === 'OPEN' && 'Pool Open - Accepting Pledges'}
              {status === 'GOAL_REACHED' && 'Goal Reached - Collecting Payments'}
              {status === 'CLOSED' && 'Pool Closed'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Color Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Purple */}
        <PoolColorCard
          color="PURPLE"
          total={purple.total}
          pledgeCount={purple.pledgeCount}
          isClickable={!!purple.id && status === 'OPEN'}
          isLocked={!userAccess.isOverseer && userAccess.accessCutId !== purple.id}
          onClick={() => purple.id && onColorSelect(purple.id, 'PURPLE')}
        />

        {/* Orange */}
        <PoolColorCard
          color="ORANGE"
          total={orange.total}
          pledgeCount={orange.pledgeCount}
          isClickable={!!orange.id && status === 'OPEN'}
          isLocked={!userAccess.isOverseer && userAccess.accessCutId !== orange.id}
          onClick={() => orange.id && onColorSelect(orange.id, 'ORANGE')}
        />

        {/* Green */}
        <PoolColorCard
          color="GREEN"
          total={green.total}
          pledgeCount={green.pledgeCount}
          isClickable={!!green.id && status === 'OPEN'}
          isLocked={!userAccess.isOverseer && userAccess.accessCutId !== green.id}
          onClick={() => green.id && onColorSelect(green.id, 'GREEN')}
        />

        {/* Blue (Combined Total) */}
        <PoolColorCard
          color="BLUE"
          total={blueTotal}
          pledgeCount={totalPledgeCount}
          goalAmount={goalAmount}
          isClickable={false}
          isLocked={false}
        />
      </div>
    </div>
  )
}
