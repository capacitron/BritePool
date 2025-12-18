'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, User, Filter } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  slug: string
  thumbnail: string | null
  category: string
  createdBy: { id: string; name: string }
  lessonCount: number
  isEnrolled: boolean
  userProgress: {
    progress: number
    isCompleted: boolean
    completedLessons: string[]
  } | null
}

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'EMPOWERMENT', label: 'Empowerment' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'STEWARDSHIP', label: 'Stewardship' },
  { value: 'OTHER', label: 'Other' },
]

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse')
  const [category, setCategory] = useState('ALL')

  useEffect(() => {
    fetchCourses()
  }, [activeTab, category])

  async function fetchCourses() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'ALL') {
        params.append('category', category)
      }
      if (activeTab === 'my') {
        params.append('enrolled', 'true')
      }
      
      const response = await fetch(`/api/courses?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayedCourses = activeTab === 'my' 
    ? courses.filter(c => c.isEnrolled)
    : courses

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            Learning Center
          </h1>
          <p className="text-earth-brown-light mt-1">
            Expand your knowledge with our curated courses
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveTab('browse')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>
          <Button
            variant={activeTab === 'my' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my')}
          >
            <User className="h-4 w-4 mr-2" />
            My Courses
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-earth-brown-light" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-stone rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-earth-brown"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-stone-warm rounded-t-xl" />
              <CardHeader>
                <div className="h-6 bg-stone-warm rounded w-3/4" />
                <div className="h-4 bg-stone-warm rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : displayedCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
          <h3 className="text-lg font-medium text-earth-brown-dark">
            {activeTab === 'my' ? 'No enrolled courses yet' : 'No courses found'}
          </h3>
          <p className="text-earth-brown-light mt-1">
            {activeTab === 'my' 
              ? 'Browse our catalog to find courses that interest you'
              : 'Check back soon for new courses'
            }
          </p>
          {activeTab === 'my' && (
            <Button className="mt-4" onClick={() => setActiveTab('browse')}>
              Browse Courses
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <div 
                  className="h-40 bg-gradient-to-br from-earth-brown to-earth-brown-dark flex items-center justify-center"
                  style={course.thumbnail ? { 
                    backgroundImage: `url(${course.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : undefined}
                >
                  {!course.thumbnail && (
                    <BookOpen className="h-16 w-16 text-white/50" />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-stone-warm rounded-full text-earth-brown-dark capitalize">
                      {course.category.toLowerCase()}
                    </span>
                    {course.isEnrolled && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Enrolled
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-earth-brown-light">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {course.createdBy.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.lessonCount} lessons
                    </div>
                  </div>
                  
                  {course.userProgress && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-earth-brown-light">Progress</span>
                        <span className="font-medium text-earth-brown-dark">
                          {Math.round(course.userProgress.progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-stone-warm rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-earth-brown rounded-full transition-all"
                          style={{ width: `${course.userProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
