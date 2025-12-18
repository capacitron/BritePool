import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            type: true,
            duration: true
          }
        },
        progress: {
          where: { userId: session.user.id },
          select: {
            id: true,
            progress: true,
            isCompleted: true,
            completedLessons: true,
            startedAt: true,
            completedAt: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const userProgress = course.progress[0] || null

    return NextResponse.json({
      ...course,
      lessonCount: course.lessons.length,
      userProgress,
      isEnrolled: course.progress.length > 0
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}
