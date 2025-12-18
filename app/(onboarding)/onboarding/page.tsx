import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, onboardingCompleted: true },
  })

  if (user?.onboardingCompleted) {
    redirect('/dashboard')
  }

  const stepRoutes = [
    '/onboarding/welcome',
    '/onboarding/profile',
    '/onboarding/interests',
    '/onboarding/complete',
  ]

  const currentStep = user?.onboardingStep || 0
  redirect(stepRoutes[Math.min(currentStep, stepRoutes.length - 1)])
}
