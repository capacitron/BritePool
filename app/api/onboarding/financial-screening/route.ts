import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SCORE_MAP: { [key: string]: { [key: string]: number } } = {
  financialRhythm: {
    stable_discretionary: 4,
    stable_conservative: 3,
    building_start_small: 2,
    reorganizing_low_commitment: 1,
  },
  opportunityApproach: {
    research_thoroughly: 4,
    phased_incremental: 3,
    seek_counsel: 3,
    move_quickly: 2,
  },
  timelineAlignment: {
    long_term_2_plus: 4,
    steady_strategic_growth: 4,
    mid_range_6_18: 3,
    short_term_liquidity: 1,
  },
  responseToDelays: {
    no_significant_impact: 4,
    wants_updates: 3,
    some_stress_but_steady: 2,
    needs_exit_path: 1,
  },
  primaryIntentions: {
    diversification: 4,
    wealth_building: 3,
    community_alignment: 3,
    healing_ventures: 3,
    learning_exposure: 2,
    other: 2,
  },
  guidancePreference: {
    no_guidance_needed: 4,
    possibly: 3,
    yes_guidance: 2,
  },
}

function calculateScore(data: {
  financialRhythm: string
  opportunityApproach: string
  timelineAlignment: string
  responseToDelays: string
  primaryIntentions: string[]
  guidancePreference: string
}) {
  const q1 = SCORE_MAP.financialRhythm[data.financialRhythm] || 1
  const q2 = SCORE_MAP.opportunityApproach[data.opportunityApproach] || 1
  const q3 = SCORE_MAP.timelineAlignment[data.timelineAlignment] || 1
  const q4 = SCORE_MAP.responseToDelays[data.responseToDelays] || 1

  const intentionScores = data.primaryIntentions.map(
    (i) => SCORE_MAP.primaryIntentions[i] || 2
  )
  const q5 = Math.max(...intentionScores, 2)

  const q6 = SCORE_MAP.guidancePreference[data.guidancePreference] || 2

  const totalScore = q1 + q2 + q3 + q4 + q5 + q6

  let tier: string
  if (totalScore >= 20) tier = 'Strategic Anchor'
  else if (totalScore >= 15) tier = 'Structured Grower'
  else if (totalScore >= 11) tier = 'Foundation Tier'
  else tier = 'Educational / Deferred'

  let flagLevel = 'None'
  let internalReviewRequired = false

  if (
    (q1 === 1 && q3 === 1) ||
    (q4 === 1 && q3 === 1) ||
    (q1 === 1 && q4 <= 2)
  ) {
    flagLevel = 'Hard Stop'
    tier = 'Educational / Deferred'
    internalReviewRequired = true
  } else if (
    (totalScore >= 11 && totalScore <= 14) ||
    (q3 === 1 && q4 <= 2)
  ) {
    flagLevel = 'Moderate'
    internalReviewRequired = true
  } else if (q2 === 2 && q3 <= 3) {
    flagLevel = 'Soft'
  }

  let suggestedEntryCap: string
  if (totalScore >= 20) suggestedEntryCap = 'Full Tier Eligible'
  else if (totalScore >= 15) suggestedEntryCap = 'Mid Tier Recommended'
  else if (totalScore >= 11) suggestedEntryCap = 'Foundation Tier Only'
  else suggestedEntryCap = 'Educational Only'

  return { totalScore, tier, flagLevel, suggestedEntryCap, internalReviewRequired }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      financialRhythm,
      opportunityApproach,
      timelineAlignment,
      responseToDelays,
      primaryIntentions,
      guidancePreference,
    } = body

    if (
      !financialRhythm ||
      !opportunityApproach ||
      !timelineAlignment ||
      !responseToDelays ||
      !primaryIntentions ||
      !Array.isArray(primaryIntentions) ||
      primaryIntentions.length === 0 ||
      primaryIntentions.length > 2 ||
      !guidancePreference
    ) {
      return NextResponse.json(
        { error: 'All questions must be answered. Select 1-2 intentions.' },
        { status: 400 }
      )
    }

    const scoring = calculateScore({
      financialRhythm,
      opportunityApproach,
      timelineAlignment,
      responseToDelays,
      primaryIntentions,
      guidancePreference,
    })

    await prisma.financialScreening.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        financialRhythm,
        opportunityApproach,
        timelineAlignment,
        responseToDelays,
        primaryIntentions,
        guidancePreference,
        totalScore: scoring.totalScore,
        tier: scoring.tier,
        flagLevel: scoring.flagLevel,
        suggestedEntryCap: scoring.suggestedEntryCap,
        internalReviewRequired: scoring.internalReviewRequired,
      },
      update: {
        financialRhythm,
        opportunityApproach,
        timelineAlignment,
        responseToDelays,
        primaryIntentions,
        guidancePreference,
        totalScore: scoring.totalScore,
        tier: scoring.tier,
        flagLevel: scoring.flagLevel,
        suggestedEntryCap: scoring.suggestedEntryCap,
        internalReviewRequired: scoring.internalReviewRequired,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Financial screening error:', error)
    return NextResponse.json(
      { error: 'Failed to save financial screening' },
      { status: 500 }
    )
  }
}
