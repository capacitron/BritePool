import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const markCompleteSchema = z.object({
  lessonId: z.string().min(1)
})

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

    const progress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      },
      include: {
        course: {
          include: {
            lessons: {
              select: { id: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!progress) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 404 })
    }

    return NextResponse.json({
      ...progress,
      totalLessons: progress.course.lessons.length
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const parsed = markCompleteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { lessonId } = parsed.data

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId: courseId
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found in this course' }, { status: 404 })
    }

    const existingProgress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      }
    })

    if (!existingProgress) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 404 })
    }

    const totalLessons = await prisma.lesson.count({
      where: { courseId: courseId }
    })

    const completedLessons = existingProgress.completedLessons.includes(lessonId)
      ? existingProgress.completedLessons
      : [...existingProgress.completedLessons, lessonId]

    const progressPercentage = totalLessons > 0 
      ? (completedLessons.length / totalLessons) * 100 
      : 0

    const isCompleted = completedLessons.length === totalLessons

    const updatedProgress = await prisma.courseProgress.update({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      },
      data: {
        completedLessons,
        progress: progressPercentage,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    })

    return NextResponse.json(updatedProgress)
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
