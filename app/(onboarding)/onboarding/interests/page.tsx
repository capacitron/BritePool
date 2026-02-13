'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const committees = [
  {
    id: 'GOVERNANCE',
    name: 'Governance Committee',
    description: 'Oversee organizational policies and decision-making processes',
  },
  {
    id: 'WEALTH',
    name: 'Wealth Building Committee',
    description: 'Focus on financial growth and investment strategies',
  },
  {
    id: 'EDUCATION',
    name: 'Education Committee',
    description: 'Develop and manage learning programs and resources',
  },
  {
    id: 'HEALTH',
    name: 'Health & Wellness Committee',
    description: 'Promote physical and mental well-being initiatives',
  },
  {
    id: 'OPERATIONS',
    name: 'Operations Committee',
    description: 'Handle day-to-day operational matters and logistics',
  },
]

const skills = [
  'Leadership',
  'Project Management',
  'Finance',
  'Marketing',
  'Technology',
  'Legal',
  'Healthcare',
  'Education',
  'Construction',
  'Agriculture',
  'Community Building',
  'Event Planning',
  'Content Creation',
  'Design',
  'Communication',
  'Research',
  'Sustainability',
  'Wellness',
]

const expertiseAreas = [
  'Real Estate Development',
  'Sustainable Living',
  'Alternative Health',
  'Financial Planning',
  'Legal Compliance',
  'Environmental Conservation',
  'Community Governance',
  'Holistic Education',
  'Spiritual Wellness',
]

export default function InterestsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCommittees, setSelectedCommittees] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])

  const toggleSelection = (
    item: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item))
    } else {
      setSelected([...selected, item])
    }
  }

  const handleNext = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          interests: {
            committees: selectedCommittees,
            skills: selectedSkills,
            expertise: selectedExpertise,
          },
        }),
      })
      router.push('/onboarding/financial-screening')
    } catch (error) {
      console.error('Error saving interests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/onboarding/profile')
  }

  return (
    <div className="space-y-8">
      <Card className="border-sand-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-display text-forest-800">
            Select Your Interests
          </CardTitle>
          <CardDescription className="text-forest-500 font-body">
            Tell us about your interests and expertise to help connect you with the right
            opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="font-semibold text-forest-800 mb-3 font-display">Committee Interests</h3>
            <p className="text-sm text-forest-500 mb-4 font-body">
              Which committees would you like to participate in?
            </p>
            <div className="space-y-3">
              {committees.map((committee) => (
                <label
                  key={committee.id}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCommittees.includes(committee.id)
                      ? 'border-earth-400 bg-earth-50'
                      : 'border-sand-200 hover:border-earth-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCommittees.includes(committee.id)}
                    onChange={() =>
                      toggleSelection(committee.id, selectedCommittees, setSelectedCommittees)
                    }
                    className="mt-1 h-4 w-4 rounded border-sand-300 text-earth-500 focus:ring-earth-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-forest-800 font-body">{committee.name}</span>
                    <p className="text-sm text-forest-500 mt-0.5 font-body">{committee.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-forest-800 mb-3 font-display">Skills & Abilities</h3>
            <p className="text-sm text-forest-500 mb-4 font-body">
              What skills can you contribute to the community?
            </p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSelection(skill, selectedSkills, setSelectedSkills)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all font-body ${
                    selectedSkills.includes(skill)
                      ? 'bg-earth-500 text-white'
                      : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-forest-800 mb-3 font-display">Areas of Expertise</h3>
            <p className="text-sm text-forest-500 mb-4 font-body">
              Do you have professional expertise in any of these areas?
            </p>
            <div className="flex flex-wrap gap-2">
              {expertiseAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleSelection(area, selectedExpertise, setSelectedExpertise)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all font-body ${
                    selectedExpertise.includes(area)
                      ? 'bg-forest-600 text-white'
                      : 'bg-sand-100 text-forest-700 hover:bg-sand-200'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          className="border-forest-600 border-2 text-forest-700 hover:bg-forest-600 hover:text-white font-semibold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-forest-600 hover:bg-forest-700 text-white px-8 font-semibold shadow-lg"
        >
          {isLoading ? 'Saving...' : 'Continue'}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Button>
      </div>
    </div>
  )
}
