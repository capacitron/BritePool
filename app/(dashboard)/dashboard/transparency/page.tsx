'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  PieChart,
  FileText,
  TrendingUp,
  Shield,
  ClipboardCheck,
  ExternalLink,
  Building2,
  Users,
  Leaf,
  ChevronRight,
  Loader2,
  Target
} from 'lucide-react'

interface PoolTransparency {
  hasPool: boolean
  pool?: {
    id: string
    name: string
    description: string | null
    goalAmount: number
    status: 'OPEN' | 'GOAL_REACHED' | 'CLOSED'
  }
  colorTotals?: {
    purple: { total: number; pledgeCount: number }
    orange: { total: number; pledgeCount: number }
    green: { total: number; pledgeCount: number }
    blue: { total: number; pledgeCount: number }
  }
  totalPledged?: number
  goalAmount?: number
  progress?: number
  isGoalReached?: boolean
}

const budgetCategories = [
  { name: 'Land Development', percentage: 35, amount: 700000, color: 'bg-forest-500' },
  { name: 'Infrastructure', percentage: 25, amount: 500000, color: 'bg-forest-600' },
  { name: 'Community Programs', percentage: 20, amount: 400000, color: 'bg-earth-500' },
  { name: 'Operations', percentage: 15, amount: 300000, color: 'bg-earth-400' },
  { name: 'Emergency Reserve', percentage: 5, amount: 100000, color: 'bg-sand-500' },
]

const recentReports = [
  { id: 1, title: 'Q4 2024 Financial Report', date: 'December 2024', type: 'Quarterly Report' },
  { id: 2, title: 'Annual Audit Report 2024', date: 'November 2024', type: 'Audit' },
  { id: 3, title: 'Q3 2024 Financial Report', date: 'September 2024', type: 'Quarterly Report' },
  { id: 4, title: 'Mid-Year Budget Review', date: 'July 2024', type: 'Budget Review' },
]

export default function TransparencyPage() {
  const [poolData, setPoolData] = useState<PoolTransparency | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPoolData()
  }, [])

  async function fetchPoolData() {
    try {
      const res = await fetch('/api/pools/transparency')
      if (res.ok) {
        const data = await res.json()
        setPoolData(data)
      }
    } catch (err) {
      console.error('Error fetching pool data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">
          Transparency Hub
        </h1>
        <p className="text-forest-500 mt-1 font-body">
          Financial transparency and accountability for our community
        </p>
      </div>

      {/* Stakeholder Pool Section */}
      {loading ? (
        <Card className="border-sand-200">
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
          </CardContent>
        </Card>
      ) : poolData?.hasPool ? (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="font-display text-forest-800">
                    {poolData.pool?.name || 'Stakeholder Pool'}
                  </CardTitle>
                  <CardDescription className="font-body">
                    Private pledge pool - Combined team totals
                  </CardDescription>
                </div>
              </div>
              {poolData.isGoalReached && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Goal Reached!
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pool Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Purple */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm font-medium text-purple-700">Purple</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  ${poolData.colorTotals?.purple.total.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-purple-600">
                  {poolData.colorTotals?.purple.pledgeCount || 0} pledges
                </p>
              </div>

              {/* Orange */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm font-medium text-orange-700">Orange</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  ${poolData.colorTotals?.orange.total.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-orange-600">
                  {poolData.colorTotals?.orange.pledgeCount || 0} pledges
                </p>
              </div>

              {/* Green */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Green</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  ${poolData.colorTotals?.green.total.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600">
                  {poolData.colorTotals?.green.pledgeCount || 0} pledges
                </p>
              </div>

              {/* Blue (Combined) */}
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Combined Total</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ${poolData.colorTotals?.blue.total.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-blue-600">
                  {poolData.colorTotals?.blue.pledgeCount || 0} total pledges
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-forest-700">Pool Progress</span>
                <span className="text-sm text-forest-500">
                  {poolData.progress?.toFixed(1)}% of ${poolData.goalAmount?.toLocaleString()} goal
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                {/* Stacked color segments */}
                {poolData.colorTotals && poolData.goalAmount && (
                  <>
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${(poolData.colorTotals.purple.total / poolData.goalAmount) * 100}%` }}
                    />
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${(poolData.colorTotals.orange.total / poolData.goalAmount) * 100}%` }}
                    />
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(poolData.colorTotals.green.total / poolData.goalAmount) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-center gap-6 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Purple</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Orange</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Green</span>
                </div>
              </div>
            </div>

            {/* View Pool Link */}
            <div className="flex justify-center pt-2">
              <Link href="/dashboard/stakeholder">
                <Button variant="outline" className="border-blue-500 text-blue-700 hover:bg-blue-50">
                  View Full Pool Dashboard
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-sand-200 bg-sand-50">
          <CardContent className="py-8 text-center">
            <Target className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-forest-600 font-body">
              No active stakeholder pool at this time
            </p>
          </CardContent>
        </Card>
      )}

      {/* Original Transparency Content */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-forest-50 to-forest-100 border-forest-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-forest-600 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-forest-600 font-body">Total Raised</p>
                <p className="text-2xl font-bold font-display text-forest-800">
                  $1,250,000
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sand-50 to-sand-100 border-sand-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-forest-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-forest-600 font-body">Total Spent</p>
                <p className="text-2xl font-bold font-display text-forest-800">
                  $875,000
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-earth-50 to-earth-100 border-earth-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-earth-500 rounded-lg">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-forest-600 font-body">Budget Goal</p>
                <p className="text-2xl font-bold font-display text-forest-800">
                  $2,000,000
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sand-100 to-sand-200 border-sand-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-earth-400 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-forest-600 font-body">Progress</p>
                <p className="text-2xl font-bold font-display text-forest-800">
                  62.5%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-sand-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <PieChart className="h-5 w-5 text-forest-600" />
              Budget Allocation
            </CardTitle>
            <CardDescription className="text-forest-500 font-body">
              How funds are distributed across key areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium font-body text-forest-800">
                      {category.name}
                    </span>
                    <span className="text-sm text-forest-500 font-body">
                      ${category.amount.toLocaleString()} ({category.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-sand-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${category.color} rounded-full transition-all`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sand-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-forest-800">
              <FileText className="h-5 w-5 text-forest-600" />
              Recent Reports
            </CardTitle>
            <CardDescription className="text-forest-500 font-body">
              Latest financial and audit reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-sand-50 rounded-lg hover:bg-sand-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-forest-500" />
                    <div>
                      <p className="font-medium font-body text-forest-800">{report.title}</p>
                      <p className="text-sm text-forest-500 font-body">{report.date}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-forest-100 text-forest-700 px-2 py-1 rounded font-body">
                    {report.type}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/documents?category=FINANCIAL">
              <Button variant="outline" className="w-full mt-4 border-forest-600 text-forest-700 hover:bg-forest-50">
                View All Financial Documents
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow border-sand-200">
          <CardHeader>
            <div className="p-3 bg-forest-100 rounded-lg w-fit mb-2">
              <Shield className="h-6 w-6 text-forest-600" />
            </div>
            <CardTitle className="font-display text-forest-800">Audit Reports</CardTitle>
            <CardDescription className="text-forest-500 font-body">
              Independent financial audits and compliance reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/documents?category=FINANCIAL">
              <Button variant="outline" className="w-full border-forest-600 text-forest-700 hover:bg-forest-50">
                View Audit Reports
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-sand-200">
          <CardHeader>
            <div className="p-3 bg-sand-200 rounded-lg w-fit mb-2">
              <Building2 className="h-6 w-6 text-forest-600" />
            </div>
            <CardTitle className="font-display text-forest-800">Governance Documents</CardTitle>
            <CardDescription className="text-forest-500 font-body">
              Bylaws, policies, and organizational structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/documents?category=GOVERNANCE">
              <Button variant="outline" className="w-full border-forest-600 text-forest-700 hover:bg-forest-50">
                View Governance Docs
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-sand-200">
          <CardHeader>
            <div className="p-3 bg-earth-100 rounded-lg w-fit mb-2">
              <Users className="h-6 w-6 text-earth-600" />
            </div>
            <CardTitle className="font-display text-forest-800">Member Reports</CardTitle>
            <CardDescription className="text-forest-500 font-body">
              Updates on membership, participation, and community growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/documents?category=OPERATIONAL">
              <Button variant="outline" className="w-full border-forest-600 text-forest-700 hover:bg-forest-50">
                View Member Reports
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-forest-700 to-forest-800 text-white border-0">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-lg">
                <Leaf className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold font-display">Our Commitment to Transparency</h3>
                <p className="text-white/80 mt-1 font-body">
                  We believe in full accountability to our community members. All financial
                  decisions and expenditures are documented and available for review.
                </p>
              </div>
            </div>
            <Link href="/dashboard/documents">
              <Button className="bg-white text-forest-700 hover:bg-sand-100 whitespace-nowrap">
                Browse All Documents
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
