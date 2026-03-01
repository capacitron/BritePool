'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Link2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { OutreachTemplates } from '@/components/outreach/OutreachTemplates'
import Link from 'next/link'

export default function OutreachPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch profile')
        }
        const data = await res.json()
        setUsername(data.username || null)
        setFullName(data.name || null)
      } catch {
        // Profile fetch failed
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader path="outreach" />

      <div>
        <h1 className="text-3xl font-display font-bold text-forest-800">Outreach Toolkit</h1>
        <p className="text-forest-500 mt-1 font-body">
          Ready-to-use templates for email, X (Twitter), and Instagram — crafted to invite your
          people into the movement.
        </p>
      </div>

      {username ? (
        <>
          <div className="flex items-center gap-3 px-4 py-3 bg-forest-50 border border-forest-100 rounded-lg">
            <Link2 className="h-4 w-4 text-forest-600 shrink-0" />
            <p className="text-sm text-forest-700 font-body">
              Your referral link{' '}
              <span className="font-mono font-semibold">britepool.org/{username}</span> is
              automatically included in all templates below.
            </p>
          </div>
          <OutreachTemplates username={username} fullName={fullName} />
        </>
      ) : (
        <Card className="border-sand-200">
          <CardContent className="p-12 text-center">
            <Link2 className="h-12 w-12 text-forest-300 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-forest-700 mb-2">
              Set Up Your Referral Link First
            </h3>
            <p className="text-forest-500 font-body mb-6 max-w-md mx-auto">
              To use outreach templates with your personal referral link, you need to set a
              BritePool username on your profile first.
            </p>
            <Link href="/dashboard/profile">
              <Button className="bg-forest-600 hover:bg-forest-700 text-white">
                Go to Profile Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
