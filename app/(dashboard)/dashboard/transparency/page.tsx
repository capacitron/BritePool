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
  { name: 'Land Development', percentage: 35, amount: 700000, color: 'bg-green-500' },
  { name: 'Infrastructure', percentage: 25, amount: 500000, color: 'bg-blue-500' },
  { name: 'Community Programs', percentage: 20, amount: 400000, color: 'bg-purple-500' },
  { name: 'Operations', percentage: 15, amount: 300000, color: 'bg-amber-500' },
  { name: 'Emergency Reserve', percentage: 5, amount: 100000, color: 'bg-red-500' },
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
        <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
          Transparency Hub
        </h1>
        <p className="text-earth-brown-light mt-1">
          Financial transparency and accountability for our community
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Raised</p>
                <p className="text-2xl font-bold text-green-800">
                  ${financialSummary.totalRaised.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Spent</p>
                <p className="text-2xl font-bold text-blue-800">
                  ${financialSummary.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Budget Goal</p>
                <p className="text-2xl font-bold text-purple-800">
                  ${financialSummary.totalBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Progress</p>
                <p className="text-2xl font-bold text-amber-800">
                  {financialSummary.percentageComplete}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-earth-brown" />
              Budget Allocation
            </CardTitle>
            <CardDescription>
              How funds are distributed across key areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-earth-brown-dark">
                      {category.name}
                    </span>
                    <span className="text-sm text-earth-brown-light">
                      ${category.amount.toLocaleString()} ({category.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-stone-warm rounded-full overflow-hidden">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-earth-brown" />
              Recent Reports
            </CardTitle>
            <CardDescription>
              Latest financial and audit reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-stone-warm rounded-lg hover:bg-stone transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-earth-brown-light" />
                    <div>
                      <p className="font-medium text-earth-brown-dark">{report.title}</p>
                      <p className="text-sm text-earth-brown-light">{report.date}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-earth-brown/10 text-earth-brown px-2 py-1 rounded">
                    {report.type}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/documents?category=FINANCIAL">
              <Button variant="outline" className="w-full mt-4">
                View All Financial Documents
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-2">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Audit Reports</CardTitle>
            <CardDescription>
              Independent financial audits and compliance reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/documents?category=FINANCIAL">
              <Button variant="outline" className="w-full">
                View Audit Reports
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-2">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Governance Documents</CardTitle>
            <CardDescription>
              Bylaws, policies, and organizational structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/documents?category=GOVERNANCE">
              <Button variant="outline" className="w-full">
                View Governance Docs
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-2">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Member Reports</CardTitle>
            <CardDescription>
              Updates on membership, participation, and community growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/documents?category=OPERATIONAL">
              <Button variant="outline" className="w-full">
                View Member Reports
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-earth-brown to-earth-brown-dark text-white">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-lg">
                <Leaf className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Our Commitment to Transparency</h3>
                <p className="text-white/80 mt-1">
                  We believe in full accountability to our community members. All financial 
                  decisions and expenditures are documented and available for review.
                </p>
              </div>
            </div>
            <Link href="/dashboard/documents">
              <Button className="bg-white text-earth-brown hover:bg-stone-warm whitespace-nowrap">
                Browse All Documents
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
