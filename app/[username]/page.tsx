import { redirect, notFound } from 'next/navigation'
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

  redirect(`/register?ref=${user.username}`)
}
