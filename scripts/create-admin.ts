import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'jon@capacitron.com'
  const password = '4-Honor-Gratitude!'
  const name = 'Jon'

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'WEB_STEWARD',
      status: 'ACTIVE',
    },
    create: {
      email,
      name,
      passwordHash,
      role: 'WEB_STEWARD',
      status: 'ACTIVE',
    },
  })

  console.log('Admin user created successfully:')
  console.log({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
