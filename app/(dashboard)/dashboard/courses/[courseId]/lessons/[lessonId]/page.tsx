'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  order: number
  type: 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ'
  videoUrl: string | null
  pdfUrl: string | null
  content: string | null
  duration: number | null
}

interface Course {
  id: string
  title: string
  lessons: Lesson[]
  userProgress: {
    completedLessons: string[]
    progress: number
  } | null
}

export default function LessonPage({ 
  params 
}: { 
  params: Promise<{ courseId: string; lessonId: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    fetchData()
  }, [resolvedParams.courseId, resolvedParams.lessonId])

  async function fetchData() {
    setLoading(true)
    try {
      const response = await fetch(`/api/courses/${resolvedParams.courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
        
        const currentLesson = data.lessons.find((l: Lesson) => l.id === resolvedParams.lessonId)
        if (currentLesson) {
          setLesson(currentLesson)
          setIsCompleted(data.userProgress?.completedLessons?.includes(currentLesson.id) || false)
        } else {
          router.push(`/dashboard/courses/${resolvedParams.courseId}`)
        }
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkComplete() {
    if (!course || !lesson) return
    
    setMarking(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id })
      })
      
      if (response.ok) {
        setIsCompleted(true)
        fetchData()
      }
    } catch (error) {
      console.error('Error marking complete:', error)
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-stone-warm rounded w-1/4" />
        <div className="h-96 bg-stone-warm rounded-xl" />
      </div>
    )
  }

  if (!course || !lesson) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
        <h2 className="text-xl font-medium text-earth-brown-dark">Lesson not found</h2>
        <Link href="/dashboard/courses">
          <Button className="mt-4">Back to Courses</Button>
        </Link>
      </div>
    )
  }

  const currentIndex = course.lessons.findIndex(l => l.id === lesson.id)
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null

  function renderLessonContent() {
    if (!lesson) return null

    switch (lesson.type) {
      case 'VIDEO':
        return (
          <div className="space-y-4">
            {lesson.videoUrl ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {lesson.videoUrl.includes('youtube') || lesson.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : lesson.videoUrl.includes('vimeo') ? (
                  <iframe
                    src={lesson.videoUrl.replace('vimeo.com', 'player.vimeo.com/video')}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
            ) : (
              <div className="aspect-video bg-stone-warm rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto text-earth-brown-light mb-2" />
                  <p className="text-earth-brown-light">Video not available</p>
                </div>
              </div>
            )}
            {lesson.content && (
              <div className="prose prose-stone max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        )
        
      case 'PDF':
        return (
          <div className="space-y-4">
            {lesson.pdfUrl ? (
              <>
                <div className="aspect-[3/4] bg-stone-warm rounded-lg overflow-hidden">
                  <iframe
                    src={lesson.pdfUrl}
                    className="w-full h-full"
                  />
                </div>
                <a 
                  href={lesson.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-earth-brown hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open PDF in new tab
                </a>
              </>
            ) : (
              <div className="aspect-[3/4] bg-stone-warm rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-earth-brown-light mb-2" />
                  <p className="text-earth-brown-light">PDF not available</p>
                </div>
              </div>
            )}
            {lesson.content && (
              <div className="prose prose-stone max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        )
        
      case 'QUIZ':
        return (
          <div className="space-y-4">
            <Card className="border-2 border-dashed border-earth-brown-light">
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-16 w-16 mx-auto text-earth-brown-light mb-4" />
                <h3 className="text-lg font-medium text-earth-brown-dark mb-2">Quiz Content</h3>
                <p className="text-earth-brown-light">
                  Quiz functionality coming soon
                </p>
              </CardContent>
            </Card>
            {lesson.content && (
              <div className="prose prose-stone max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        )
        
      case 'TEXT':
      default:
        return (
          <div className="prose prose-stone max-w-none">
            {lesson.content ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
            ) : (
              <p className="text-earth-brown-light text-center py-8">
                No content available for this lesson
              </p>
            )}
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          href={`/dashboard/courses/${course.id}`} 
          className="inline-flex items-center gap-2 text-earth-brown-light hover:text-earth-brown-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {course.title}
        </Link>
        
        <div className="text-sm text-earth-brown-light">
          Lesson {currentIndex + 1} of {course.lessons.length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {lesson.type === 'VIDEO' && <Video className="h-5 w-5 text-earth-brown" />}
            {lesson.type === 'PDF' && <FileText className="h-5 w-5 text-earth-brown" />}
            {lesson.type === 'TEXT' && <BookOpen className="h-5 w-5 text-earth-brown" />}
            {lesson.type === 'QUIZ' && <HelpCircle className="h-5 w-5 text-earth-brown" />}
            <span className="text-sm text-earth-brown-light capitalize">
              {lesson.type.toLowerCase()}
            </span>
            {isCompleted && (
              <span className="ml-2 inline-flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            )}
          </div>
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
          {lesson.description && (
            <p className="text-earth-brown-light mt-2">{lesson.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {renderLessonContent()}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        {prevLesson ? (
          <Link href={`/dashboard/courses/${course.id}/lessons/${prevLesson.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {!isCompleted && (
            <Button 
              onClick={handleMarkComplete}
              disabled={marking}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {marking ? 'Marking...' : 'Mark Complete'}
            </Button>
          )}
          
          {nextLesson ? (
            <Link href={`/dashboard/courses/${course.id}/lessons/${nextLesson.id}`}>
              <Button>
                Next Lesson
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link href={`/dashboard/courses/${course.id}`}>
              <Button>
                Finish Course
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
