import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Real admin emails to preserve
const PRESERVE_EMAILS = ['jon@capacitron.com', 'rebecca@whiterabbit.academy']

async function main() {
  console.log('🧹 Starting test user cleanup...')
  console.log(`Preserving accounts: ${PRESERVE_EMAILS.join(', ')}`)

  // Find all users to delete (everyone except preserved emails)
  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        notIn: PRESERVE_EMAILS,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  if (usersToDelete.length === 0) {
    console.log('✅ No test users found to delete.')
    return
  }

  console.log(`\nFound ${usersToDelete.length} test user(s) to delete:`)
  usersToDelete.forEach((u) => console.log(`  - ${u.email} (${u.name})`))

  const userIds = usersToDelete.map((u) => u.id)

  // Delete related data in proper order (due to foreign key constraints)
  console.log('\n🗑️  Deleting related data...')

  // Delete sessions
  const sessions = await prisma.session.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Sessions: ${sessions.count}`)

  // Delete password reset tokens
  const passwordTokens = await prisma.passwordResetToken.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Password reset tokens: ${passwordTokens.count}`)

  // Delete user profiles
  const profiles = await prisma.userProfile.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - User profiles: ${profiles.count}`)

  // Delete notifications
  const notifications = await prisma.notification.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Notifications: ${notifications.count}`)

  // Delete committee memberships
  const memberships = await prisma.committeeMember.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Committee memberships: ${memberships.count}`)

  // Delete committee chat messages
  const chatMessages = await prisma.committeeChatMessage.deleteMany({
    where: { authorId: { in: userIds } },
  })
  console.log(`  - Committee chat messages: ${chatMessages.count}`)

  // Delete event registrations
  const registrations = await prisma.eventRegistration.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Event registrations: ${registrations.count}`)

  // Delete forum posts (including replies)
  const posts = await prisma.forumPost.deleteMany({
    where: { authorId: { in: userIds } },
  })
  console.log(`  - Forum posts: ${posts.count}`)

  // Delete audit logs
  const auditLogs = await prisma.auditLog.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Audit logs: ${auditLogs.count}`)

  // Delete participation logs
  const participationLogs = await prisma.participationLog.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Participation logs: ${participationLogs.count}`)

  // Delete course progress
  const courseProgress = await prisma.courseProgress.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Course progress: ${courseProgress.count}`)

  // Delete pledges
  const pledges = await prisma.pledge.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Pledges: ${pledges.count}`)

  // Delete communal seat submissions
  const seatSubmissions = await prisma.communalSeatSubmission.deleteMany({
    where: { userId: { in: userIds } },
  })
  console.log(`  - Communal seat submissions: ${seatSubmissions.count}`)

  // Finally, delete the users
  console.log('\n🗑️  Deleting users...')
  const deleted = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  })
  console.log(`  - Users deleted: ${deleted.count}`)

  console.log('\n✅ Test user cleanup complete!')
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
