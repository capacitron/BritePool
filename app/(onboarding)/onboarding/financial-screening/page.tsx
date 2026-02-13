'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, DollarSign, Target, Clock, Shield, Compass, HelpCircle, UserPlus, Search, X } from 'lucide-react'

const questions = [
  {
    id: 'financialRhythm',
    icon: DollarSign,
    title: 'Financial Readiness',
    question: 'Which best describes your current financial rhythm?',
    options: [
      { value: 'stable_discretionary', label: 'I am stable and have discretionary funds available for growth opportunities.' },
      { value: 'stable_conservative', label: 'I am stable but prefer conservative participation.' },
      { value: 'building_start_small', label: 'I am building toward greater stability and would start small.' },
      { value: 'reorganizing_low_commitment', label: 'I am currently reorganizing finances and need low-commitment options.' },
    ],
  },
  {
    id: 'opportunityApproach',
    icon: Target,
    title: 'Decision Style',
    question: 'How do you typically approach new financial opportunities?',
    options: [
      { value: 'move_quickly', label: 'I move quickly when something resonates.' },
      { value: 'research_thoroughly', label: 'I research thoroughly before committing.' },
      { value: 'phased_incremental', label: 'I prefer phased or incremental entry.' },
      { value: 'seek_counsel', label: 'I seek counsel before making decisions.' },
    ],
  },
  {
    id: 'timelineAlignment',
    icon: Clock,
    title: 'Timeline Alignment',
    question: 'What type of timeline feels aligned for your participation?',
    options: [
      { value: 'short_term_liquidity', label: 'I am seeking short-term liquidity or quicker cycles.' },
      { value: 'mid_range_6_18', label: 'I am comfortable with mid-range timelines (6\u201318 months).' },
      { value: 'long_term_2_plus', label: 'I prefer long-term positioning (2+ years).' },
      { value: 'steady_strategic_growth', label: 'I value steady, strategic growth over speed.' },
    ],
  },
  {
    id: 'responseToDelays',
    icon: Shield,
    title: 'Resilience & Flexibility',
    question: 'If timelines extend beyond expectations, how would that affect you?',
    options: [
      { value: 'no_significant_impact', label: 'It would not significantly impact me.' },
      { value: 'wants_updates', label: 'I would want regular communication and updates.' },
      { value: 'some_stress_but_steady', label: 'It may create some stress, but I can stay steady.' },
      { value: 'needs_exit_path', label: 'I would need structured flexibility or an exit path.' },
    ],
  },
  {
    id: 'primaryIntentions',
    icon: Compass,
    title: 'Primary Intention',
    question: 'What is your primary intention in joining Brite Pool? (Select up to 2)',
    multiSelect: true,
    maxSelections: 2,
    options: [
      { value: 'wealth_building', label: 'Wealth building' },
      { value: 'diversification', label: 'Diversification' },
      { value: 'community_alignment', label: 'Community alignment' },
      { value: 'learning_exposure', label: 'Learning and exposure' },
      { value: 'healing_ventures', label: 'Healing ventures and opportunities' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'guidancePreference',
    icon: HelpCircle,
    title: 'Guidance Preference',
    question: 'Would you like guidance in determining a participation level that aligns with your current season?',
    options: [
      { value: 'yes_guidance', label: 'Yes' },
      { value: 'possibly', label: 'Possibly' },
      { value: 'no_guidance_needed', label: 'No, I already know my comfort range.' },
    ],
  },
]

interface MemberResult {
  id: string
  name: string
  role: string
}

export default function FinancialScreeningPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    primaryIntentions: [],
  })

  const [referralQuery, setReferralQuery] = useState('')
  const [referralResults, setReferralResults] = useState<MemberResult[]>([])
  const [selectedReferrer, setSelectedReferrer] = useState<MemberResult | null>(null)
  const [referralSearching, setReferralSearching] = useState(false)
  const [showReferralDropdown, setShowReferralDropdown] = useState(false)
  const referralRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const searchMembers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setReferralResults([])
      setShowReferralDropdown(false)
      return
    }
    setReferralSearching(true)
    try {
      const res = await fetch(`/api/members/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setReferralResults(data.members || [])
        setShowReferralDropdown(true)
      }
    } catch {
      setReferralResults([])
    } finally {
      setReferralSearching(false)
    }
  }, [])

  const handleReferralInput = (value: string) => {
    setReferralQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchMembers(value), 300)
  }

  const selectReferrer = (member: MemberResult) => {
    setSelectedReferrer(member)
    setReferralQuery('')
    setShowReferralDropdown(false)
    setReferralResults([])
  }

  const clearReferrer = () => {
    setSelectedReferrer(null)
    setReferralQuery('')
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (referralRef.current && !referralRef.current.contains(e.target as Node)) {
        setShowReferralDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setError(null)
  }

  const handleMultiSelectToggle = (questionId: string, value: string, max: number) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || []
      if (current.includes(value)) {
        return { ...prev, [questionId]: current.filter((v) => v !== value) }
      }
      if (current.length >= max) {
        return prev
      }
      return { ...prev, [questionId]: [...current, value] }
    })
    setError(null)
  }

  const isComplete = () => {
    return questions.every((q) => {
      if (q.multiSelect) {
        const val = answers[q.id] as string[]
        return val && val.length > 0
      }
      return !!answers[q.id]
    })
  }

  const handleNext = async () => {
    if (!isComplete()) {
      setError('Please answer all questions before continuing.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/financial-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          ...(selectedReferrer ? { referredById: selectedReferrer.id } : {}),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save responses.')
        return
      }

      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 4 }),
      })

      router.push('/onboarding/complete')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/interests')
  }

  const answeredCount = questions.filter((q) => {
    if (q.multiSelect) return ((answers[q.id] as string[]) || []).length > 0
    return !!answers[q.id]
  }).length

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 p-8 text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 30L30 55L5 30z' fill='none' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-earth-400/20 rounded-full blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-earth-400 to-transparent" />
              <span className="text-earth-300 text-sm font-medium uppercase tracking-wider font-body">Step 4 of 5</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Financial Alignment</h1>
            <p className="text-sand-200 max-w-lg font-body">
              We believe in sovereign participation. These questions help us understand how to guide you responsibly and ensure that any involvement is aligned with your current financial season.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle
                  cx="48" cy="48" r="40" fill="none" stroke="#ea8f6f" strokeWidth="6"
                  strokeDasharray={`${(answeredCount / questions.length) * 251} 251`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold font-display">{answeredCount}/{questions.length}</span>
              </div>
            </div>
            <span className="text-sand-300 text-xs mt-2 font-body">Answered</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {questions.map((q, index) => {
          const Icon = q.icon
          const isAnswered = q.multiSelect
            ? ((answers[q.id] as string[]) || []).length > 0
            : !!answers[q.id]

          return (
            <Card key={q.id} className={`group border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${isAnswered ? 'ring-2 ring-forest-200' : ''}`}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${isAnswered ? 'from-forest-500 to-forest-300' : 'from-sand-300 to-sand-200'}`} />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isAnswered ? 'bg-forest-100' : 'bg-sand-100'}`}>
                    <Icon className={`w-6 h-6 ${isAnswered ? 'text-forest-600' : 'text-sand-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-sand-500 uppercase tracking-wider font-body">Question {index + 1}</span>
                      {isAnswered && (
                        <span className="text-xs font-medium text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full font-body">Answered</span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-forest-800 text-lg mt-1">{q.title}</h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-forest-700 font-medium mb-4 font-body">{q.question}</p>
                <div className="space-y-3">
                  {q.options.map((option) => {
                    const isSelected = q.multiSelect
                      ? ((answers[q.id] as string[]) || []).includes(option.value)
                      : answers[q.id] === option.value

                    const isDisabled = q.multiSelect &&
                      !isSelected &&
                      ((answers[q.id] as string[]) || []).length >= (q.maxSelections || 2)

                    return (
                      <label
                        key={option.value}
                        className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-earth-400 bg-earth-50 shadow-md'
                            : isDisabled
                            ? 'border-sand-100 bg-sand-50 opacity-50 cursor-not-allowed'
                            : 'border-sand-200 hover:border-earth-300 hover:bg-sand-50'
                        }`}
                      >
                        <input
                          type={q.multiSelect ? 'checkbox' : 'radio'}
                          name={q.id}
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => {
                            if (q.multiSelect) {
                              handleMultiSelectToggle(q.id, option.value, q.maxSelections || 2)
                            } else {
                              handleRadioChange(q.id, option.value)
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-sand-300 text-earth-500 focus:ring-earth-500"
                        />
                        <span className={`ml-3 font-body ${isSelected ? 'text-forest-800 font-medium' : 'text-forest-700'}`}>
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-earth-400 to-earth-300" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedReferrer ? 'bg-forest-100' : 'bg-sand-100'}`}>
              <UserPlus className={`w-6 h-6 ${selectedReferrer ? 'text-forest-600' : 'text-sand-500'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-sand-500 uppercase tracking-wider font-body">Connection</span>
                <span className="text-xs font-medium text-sand-400 bg-sand-50 px-2 py-0.5 rounded-full font-body">Optional</span>
              </div>
              <h3 className="font-display font-semibold text-forest-800 text-lg mt-1">Who Introduced You?</h3>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-forest-700 font-medium mb-4 font-body">
            If a current member introduced you to Brite Pool, search for them below. This connects you for networking within our Wealth Generation Opportunities.
          </p>
          <div ref={referralRef} className="relative">
            {selectedReferrer ? (
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-earth-400 bg-earth-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedReferrer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-forest-800 font-body">{selectedReferrer.name}</p>
                    <p className="text-xs text-forest-500 font-body">{selectedReferrer.role}</p>
                  </div>
                </div>
                <button
                  onClick={clearReferrer}
                  className="p-1.5 rounded-lg hover:bg-earth-200 transition-colors"
                >
                  <X className="w-4 h-4 text-forest-600" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
                  <input
                    type="text"
                    value={referralQuery}
                    onChange={(e) => handleReferralInput(e.target.value)}
                    placeholder="Search by member name..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-sand-200 focus:border-earth-400 focus:ring-0 outline-none text-forest-800 placeholder:text-sand-400 font-body transition-colors"
                  />
                  {referralSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 animate-spin text-sand-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                </div>
                {showReferralDropdown && referralResults.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-xl border border-sand-200 max-h-60 overflow-auto">
                    {referralResults.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => selectReferrer(member)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-sand-50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xs">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-forest-800 text-sm font-body">{member.name}</p>
                          <p className="text-xs text-forest-500 font-body">{member.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showReferralDropdown && referralQuery.length >= 2 && referralResults.length === 0 && !referralSearching && (
                  <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-xl border border-sand-200 p-4 text-center">
                    <p className="text-sm text-sand-500 font-body">No members found matching &quot;{referralQuery}&quot;</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-earth-100 border border-earth-300 text-earth-700 px-4 py-3 rounded-lg text-sm font-body">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="border-2 border-forest-600 text-forest-700 hover:bg-forest-600 hover:text-white font-semibold px-6 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading || !isComplete()}
          className="bg-gradient-to-r from-forest-700 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
