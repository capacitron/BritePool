import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
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
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.isPublished) {
      return NextResponse.json({ error: 'Course is not available for enrollment' }, { status: 400 })
    }

    const existingProgress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      }
    })

    if (existingProgress) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
    }

    const progress = await prisma.courseProgress.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        completedLessons: [],
        progress: 0,
        isCompleted: false
      }
    })

    return NextResponse.json(progress, { status: 201 })
  } catch (error) {
    console.error('Error enrolling in course:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    )
  }
}
