import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true },
  })

  if (!user) {
    notFound()
  }

  // Silent referral click tracking (fire-and-forget)
  const headerList = await headers()
  const userAgent = headerList.get('user-agent') || undefined

  prisma.referralClick
    .create({
      data: {
        referrerId: user.id,
        userAgent: userAgent?.slice(0, 256) || null,
      },
    })
    .catch(() => {})

  redirect(`/register?ref=${user.username}`)
}
