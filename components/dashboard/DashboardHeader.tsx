import { UserRole } from '@prisma/client'
import { DashboardHeaderClient } from './DashboardHeaderClient'

interface DashboardHeaderProps {
  userName: string
  userRole: UserRole
  userImage?: string | null
}

export function DashboardHeader({ userName, userRole, userImage }: DashboardHeaderProps) {
  return (
    <DashboardHeaderClient
      userName={userName}
      userRole={userRole}
      userImage={userImage}
    />
  )
}
