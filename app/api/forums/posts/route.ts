import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000),
  categoryId: z.string().optional(),
  parentId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const parentId = searchParams.get('parentId')
    const postId = searchParams.get('postId')

    if (postId) {
      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: { id: true, name: true, role: true }
          },
          category: true,
          replies: {
            include: {
              author: {
                select: { id: true, name: true, role: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      return NextResponse.json(post)
    }

    const where: Record<string, unknown> = {}
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (parentId === 'null' || parentId === null) {
      where.parentId = null
    } else if (parentId) {
      where.parentId = parentId
    }

    const posts = await prisma.forumPost.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, role: true }
        },
        category: true,
        _count: {
          select: { replies: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author,
      category: post.category,
      isPinned: post.isPinned,
      replyCount: post._count.replies,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('Error fetching forum posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
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

    const body = await request.json()
    const parsed = createPostSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, content, categoryId, parentId } = parsed.data

    if (!parentId && !title) {
      return NextResponse.json(
        { error: 'Title is required for new topics' },
        { status: 400 }
      )
    }

    if (categoryId) {
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId }
      })
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
    }

    if (parentId) {
      const parentPost = await prisma.forumPost.findUnique({
        where: { id: parentId }
      })
      if (!parentPost) {
        return NextResponse.json(
          { error: 'Parent post not found' },
          { status: 404 }
        )
      }
    }

    const post = await prisma.forumPost.create({
      data: {
        title: title || null,
        content,
        authorId: session.user.id,
        categoryId: categoryId || null,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        },
        category: true
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating forum post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
