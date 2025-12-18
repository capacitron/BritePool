'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowLeft, 
  CheckCircle, 
  PlayCircle,
  FileText,
  Video,
  HelpCircle
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  order: number
  type: 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ'
  duration: number | null
}

interface Course {
  id: string
  title: string
  description: string | null
  slug: string
  thumbnail: string | null
  category: string
  createdBy: { id: string; name: string }
  lessons: Lesson[]
  lessonCount: number
  isEnrolled: boolean
  userProgress: {
    progress: number
    isCompleted: boolean
    completedLessons: string[]
  } | null
}

function getLessonIcon(type: string) {
  switch (type) {
    case 'VIDEO':
      return Video
    case 'PDF':
      return FileText
    case 'QUIZ':
      return HelpCircle
    default:
      return BookOpen
  }
}

export default function CourseDetailPage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchCourse()
  }, [resolvedParams.courseId])

  async function fetchCourse() {
    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${resolvedParams.courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
      } else if (response.status === 404) {
        router.push('/dashboard/courses')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll() {
    if (!course) return
    
    setEnrolling(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchCourse()
      }
    } catch (error) {
      console.error('Error enrolling:', error)
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-stone-warm rounded w-1/4" />
        <div className="h-64 bg-stone-warm rounded-xl" />
        <div className="h-32 bg-stone-warm rounded-xl" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
        <h2 className="text-xl font-medium text-earth-brown-dark">Course not found</h2>
        <Link href="/dashboard/courses">
          <Button className="mt-4">Back to Courses</Button>
        </Link>
      </div>
    )
  }

  const completedLessons = course.userProgress?.completedLessons || []

  return (
    <div className="space-y-6">
      <Link 
        href="/dashboard/courses" 
        className="inline-flex items-center gap-2 text-earth-brown-light hover:text-earth-brown-dark transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="relative rounded-xl overflow-hidden">
        <div 
          className="h-64 bg-gradient-to-br from-earth-brown to-earth-brown-dark flex items-end"
          style={course.thumbnail ? { 
            backgroundImage: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%), url(${course.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          <div className="p-8 text-white w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-white/20 rounded-full capitalize">
                {course.category.toLowerCase()}
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2">{course.title}</h1>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {course.createdBy.name}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {course.lessonCount} lessons
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {course.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-earth-brown-light whitespace-pre-wrap">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {course.lessons.length === 0 ? (
                <p className="text-earth-brown-light text-center py-4">
                  No lessons available yet
                </p>
              ) : (
                course.lessons.map((lesson, index) => {
                  const Icon = getLessonIcon(lesson.type)
                  const isCompleted = completedLessons.includes(lesson.id)
                  const isAccessible = course.isEnrolled
                  
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        isAccessible 
                          ? 'hover:bg-stone-warm cursor-pointer' 
                          : 'opacity-60'
                      } ${isCompleted ? 'bg-green-50 border-green-200' : 'border-stone'}`}
                      onClick={() => {
                        if (isAccessible) {
                          router.push(`/dashboard/courses/${course.id}/lessons/${lesson.id}`)
                        }
                      }}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-stone-warm text-earth-brown'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-earth-brown-dark truncate">
                          {lesson.title}
                        </h4>
                        {lesson.description && (
                          <p className="text-sm text-earth-brown-light truncate">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-earth-brown-light">
                        <Icon className="h-4 w-4" />
                        {lesson.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {lesson.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {course.isEnrolled ? (
                <>
                  <div className="text-center mb-4">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="font-medium text-earth-brown-dark">You're enrolled!</p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-earth-brown-light">Your Progress</span>
                      <span className="font-medium text-earth-brown-dark">
                        {Math.round(course.userProgress?.progress || 0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-stone-warm rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-earth-brown rounded-full transition-all"
                        style={{ width: `${course.userProgress?.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-earth-brown-light mt-1">
                      {completedLessons.length} of {course.lessonCount} lessons completed
                    </p>
                  </div>

                  {course.lessons.length > 0 && (
                    <Link 
                      href={`/dashboard/courses/${course.id}/lessons/${
                        course.lessons.find(l => !completedLessons.includes(l.id))?.id || course.lessons[0].id
                      }`}
                    >
                      <Button className="w-full">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {completedLessons.length === 0 ? 'Start Learning' : 'Continue Learning'}
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <BookOpen className="h-12 w-12 mx-auto text-earth-brown mb-2" />
                    <p className="text-earth-brown-light">
                      Enroll to start learning
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-earth-brown-light">Instructor</span>
                <span className="font-medium text-earth-brown-dark">{course.createdBy.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-brown-light">Lessons</span>
                <span className="font-medium text-earth-brown-dark">{course.lessonCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-brown-light">Category</span>
                <span className="font-medium text-earth-brown-dark capitalize">
                  {course.category.toLowerCase()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
