import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, canAssignRole } from '@/lib/auth-utils'
import type { UserRole, UserStatus } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole

    if (!hasPermission(userRole, 'viewUsers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        covenantAcceptedAt: true,
        covenantVersion: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    const currentUserId = session.user.id

    if (!hasPermission(userRole, 'editUsers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Prevent editing own role
    if (id === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot edit your own account through this interface' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, role: newRole, status: newStatus } = body

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: { name?: string; role?: UserRole; status?: UserStatus } = {}

    if (name) {
      updateData.name = name
    }

    if (newRole && newRole !== existingUser.role) {
      // Check if user can assign this role
      if (!canAssignRole(userRole, newRole as UserRole)) {
        return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
      }
      updateData.role = newRole as UserRole
    }

    if (newStatus && newStatus !== existingUser.status) {
      // Only WEB_STEWARD and BOARD_CHAIR can change status
      if (!hasPermission(userRole, 'editUsers')) {
        return NextResponse.json({ error: 'You cannot change user status' }, { status: 403 })
      }
      updateData.status = newStatus as UserStatus
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    })

    // TODO: Create audit log entry

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    const currentUserId = session.user.id

    if (!hasPermission(userRole, 'deleteUsers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Prevent deleting own account
    if (id === currentUserId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete by setting status to SUSPENDED
    // For actual deletion, use: await prisma.user.delete({ where: { id } });
    await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    })

    // TODO: Create audit log entry

    return NextResponse.json({ success: true, message: 'User suspended' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
