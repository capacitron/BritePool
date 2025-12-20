'use client'

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
  ChevronRight
} from 'lucide-react'

const budgetCategories = [
  { name: 'Land Development', percentage: 35, amount: 700000, color: 'bg-forest-500' },
  { name: 'Infrastructure', percentage: 25, amount: 500000, color: 'bg-forest-600' },
  { name: 'Community Programs', percentage: 20, amount: 400000, color: 'bg-earth-500' },
  { name: 'Operations', percentage: 15, amount: 300000, color: 'bg-earth-400' },
  { name: 'Emergency Reserve', percentage: 5, amount: 100000, color: 'bg-sand-500' },
]

const financialSummary = {
  totalBudget: 2000000,
  totalRaised: 1250000,
  totalSpent: 875000,
  percentageComplete: 62.5,
}

const recentReports = [
  { id: 1, title: 'Q4 2024 Financial Report', date: 'December 2024', type: 'Quarterly Report' },
  { id: 2, title: 'Annual Audit Report 2024', date: 'November 2024', type: 'Audit' },
  { id: 3, title: 'Q3 2024 Financial Report', date: 'September 2024', type: 'Quarterly Report' },
  { id: 4, title: 'Mid-Year Budget Review', date: 'July 2024', type: 'Budget Review' },
]

export default function TransparencyPage() {
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
                  ${financialSummary.totalRaised.toLocaleString()}
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
                  ${financialSummary.totalSpent.toLocaleString()}
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
                  ${financialSummary.totalBudget.toLocaleString()}
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
                  {financialSummary.percentageComplete}%
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
