import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/PageHeader'
import { SubmissionForm } from '@/components/communal-seat/SubmissionForm'
import { ArrowLeft } from 'lucide-react'

export default async function ApplyPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/communal-seat"
          className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Link>
        <PageHeader path="communal-seat" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
        <h2 className="text-xl font-bold text-forest-900 mb-2">Apply for Communal Seat</h2>
        <p className="text-forest-600 mb-8">
          Complete this form to submit your service offerings for review. All fields marked with * are required.
        </p>

        <SubmissionForm />
      </div>
    </div>
  )
}
