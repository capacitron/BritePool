import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  slug: z.string().min(1).max(100),
  thumbnail: z.string().url().optional(),
  category: z.enum(['EMPOWERMENT', 'LEADERSHIP', 'WELLNESS', 'FINANCE', 'STEWARDSHIP', 'OTHER']).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  isPublished: z.boolean().optional(),
})

const ADMIN_ROLES = ['WEB_STEWARD', 'BOARD_CHAIR', 'CONTENT_MODERATOR']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const enrolled = searchParams.get('enrolled')

    const where: Record<string, unknown> = {
      isPublished: true,
    }
    
    if (category && category !== 'ALL') {
      where.category = category
    }

    if (enrolled === 'true') {
      where.progress = {
        some: {
          userId: session.user.id
        }
      }
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        lessons: {
          select: { id: true },
          orderBy: { order: 'asc' }
        },
        progress: {
          where: { userId: session.user.id },
          select: { 
            id: true, 
            progress: true, 
            isCompleted: true,
            completedLessons: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const coursesWithProgress = courses.map(course => ({
      ...course,
      lessonCount: course.lessons.length,
      userProgress: course.progress[0] || null,
      isEnrolled: course.progress.length > 0
    }))

    return NextResponse.json(coursesWithProgress)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createCourseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, slug, thumbnail, category, status, isPublished } = parsed.data

    const existingCourse = await prisma.course.findUnique({
      where: { slug }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this slug already exists' },
        { status: 409 }
      )
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        slug,
        thumbnail: thumbnail || null,
        category: category || 'OTHER',
        status: status || 'DRAFT',
        isPublished: isPublished || false,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
