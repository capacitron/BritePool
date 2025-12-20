'use client'

import { usePathname } from 'next/navigation'

const steps = [
  { id: 'welcome', name: 'Welcome', path: '/onboarding/welcome' },
  { id: 'profile', name: 'Profile', path: '/onboarding/profile' },
  { id: 'interests', name: 'Interests', path: '/onboarding/interests' },
  { id: 'complete', name: 'Complete', path: '/onboarding/complete' },
]

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const currentStepIndex = steps.findIndex(step => pathname.includes(step.id))
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 25

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-100 via-cream to-forest-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-sand-200 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-forest-900">
                BRITE POOL
              </h1>
              <p className="text-sm text-forest-600 font-body">
                Ministerium of Empowerment
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-forest-700 font-body">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
              <p className="text-xs text-forest-500 font-body">
                {steps[currentStepIndex]?.name || 'Getting Started'}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="h-2 bg-sand-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-forest-500 to-forest-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    index <= currentStepIndex ? 'text-forest-600' : 'text-forest-300'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      index < currentStepIndex
                        ? 'bg-forest-600 border-forest-600'
                        : index === currentStepIndex
                        ? 'bg-white border-forest-600'
                        : 'bg-white border-sand-300'
                    }`}
                  />
                  <span className="text-xs mt-1 hidden sm:block font-body">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
