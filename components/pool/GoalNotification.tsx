'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Bell, DollarSign, ArrowRight } from 'lucide-react'

interface GoalNotificationProps {
  poolName: string
  goalAmount: number
  totalPledged: number
}

export function GoalNotification({ poolName, goalAmount, totalPledged }: GoalNotificationProps) {
  return (
    <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0 text-white overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

      <CardContent className="relative py-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-white/20 rounded-full">
            <Trophy className="h-12 w-12" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-display font-bold mb-2">
              Goal Reached!
            </h2>
            <p className="text-white/90 font-body mb-4">
              Congratulations! <strong>{poolName}</strong> has reached its goal of{' '}
              <strong>${goalAmount.toLocaleString()}</strong>.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                <DollarSign className="h-4 w-4" />
                <span>Total Pledged: ${totalPledged.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-3 rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="text-sm font-body">Payment notifications sent</span>
            </div>
            <Button
              variant="secondary"
              className="bg-white text-green-700 hover:bg-gray-100"
            >
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
