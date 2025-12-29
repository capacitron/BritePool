'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PoolOverview } from '@/components/pool/PoolOverview'
import { PoolColorCard } from '@/components/pool/PoolColorCard'
import { ColorEntryModal } from '@/components/pool/ColorEntryModal'
import { PledgeForm } from '@/components/pool/PledgeForm'
import { InvitationManager } from '@/components/pool/InvitationManager'
import { MemberPledgeList } from '@/components/pool/MemberPledgeList'
import { GoalNotification } from '@/components/pool/GoalNotification'
import { Loader2, Plus, Lock, Settings } from 'lucide-react'

interface Pool {
  id: string
  name: string
  description: string | null
  goalAmount: number
  status: 'OPEN' | 'GOAL_REACHED' | 'CLOSED'
  cuts: {
    id: string
    color: 'PURPLE' | 'ORANGE' | 'GREEN'
    total: number
    pledgeCount: number
    overseerId: string
    overseer: {
      id: string
      name: string
      email: string
    }
  }[]
  blueTotal: number
  progress: number
}

interface UserAccess {
  isOverseer: boolean
  overseerCutId?: string
  overseerColor?: 'PURPLE' | 'ORANGE' | 'GREEN'
  hasAccess: boolean
  accessCutId?: string
  accessColor?: 'PURPLE' | 'ORANGE' | 'GREEN'
  existingPledge?: number
}

export default function StakeholderPoolPage() {
  const router = useRouter()
  const [pool, setPool] = useState<Pool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedCut, setSelectedCut] = useState<{ id: string; color: 'PURPLE' | 'ORANGE' | 'GREEN' } | null>(null)

  // Access state
  const [userAccess, setUserAccess] = useState<UserAccess>({
    isOverseer: false,
    hasAccess: false
  })

  useEffect(() => {
    fetchPool()
    fetchUserInfo()
  }, [])

  async function fetchUserInfo() {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        setUserId(data.user?.id)
        setUserRole(data.user?.role)
      }
    } catch (err) {
      console.error('Error fetching user info:', err)
    }
  }

  async function fetchPool() {
    try {
      const res = await fetch('/api/pools')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch pools')
      }

      const pools = await res.json()

      // Get the first active pool
      const activePool = pools.find((p: Pool) => p.status === 'OPEN' || p.status === 'GOAL_REACHED')

      if (activePool) {
        setPool(activePool)
        updateUserAccess(activePool)
      }
    } catch (err) {
      console.error('Error fetching pool:', err)
      setError('Failed to load pool data')
    } finally {
      setLoading(false)
    }
  }

  function updateUserAccess(poolData: Pool) {
    if (!userId) return

    // Check if user is an overseer of any cut
    const overseerCut = poolData.cuts.find(cut => cut.overseerId === userId)

    setUserAccess({
      isOverseer: !!overseerCut,
      overseerCutId: overseerCut?.id,
      overseerColor: overseerCut?.color,
      hasAccess: !!overseerCut, // Overseers have automatic access
      accessCutId: overseerCut?.id,
      accessColor: overseerCut?.color
    })
  }

  useEffect(() => {
    if (pool && userId) {
      updateUserAccess(pool)
    }
  }, [pool, userId])

  function handleColorSelect(cutId: string, color: 'PURPLE' | 'ORANGE' | 'GREEN') {
    const cut = pool?.cuts.find(c => c.id === cutId)
    if (!cut) return

    // If user is the overseer of this cut, go directly to management
    if (cut.overseerId === userId) {
      setUserAccess(prev => ({
        ...prev,
        accessCutId: cutId,
        accessColor: color,
        hasAccess: true
      }))
      return
    }

    // Otherwise, show password modal
    setSelectedCut({ id: cutId, color })
    setShowPasswordModal(true)
  }

  function handlePasswordVerified(verified: boolean) {
    if (verified && selectedCut) {
      setUserAccess(prev => ({
        ...prev,
        accessCutId: selectedCut.id,
        accessColor: selectedCut.color,
        hasAccess: true
      }))
    }
    setShowPasswordModal(false)
    setSelectedCut(null)
  }

  function handlePledgeSuccess() {
    fetchPool() // Refresh data after pledge
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-forest-500 font-body">{error}</p>
        <Button
          onClick={fetchPool}
          variant="outline"
          className="mt-4 border-forest-600 text-forest-700 hover:bg-forest-50"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // No active pool - show create option for admins
  if (!pool) {
    const canCreate = userRole === 'BOARD_CHAIR' || userRole === 'WEB_STEWARD'

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-forest-800">Stakeholder Pool</h1>
          <p className="text-forest-500 mt-1 font-body">Private pledge pool for invited stakeholders</p>
        </div>

        <Card className="border-sand-200">
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-forest-800 mb-2">
              No Active Pool
            </h3>
            <p className="text-forest-500 font-body mb-6 max-w-md mx-auto">
              There is no active stakeholder pool at this time.
              {canCreate && ' As a Board Chair, you can create a new pool.'}
            </p>
            {canCreate && (
              <Button
                onClick={() => {/* TODO: Implement pool creation modal */}}
                className="bg-forest-600 text-white hover:bg-forest-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Pool
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-forest-800">Stakeholder Pool</h1>
          <p className="text-forest-500 mt-1 font-body">Private pledge pool for invited stakeholders</p>
        </div>
        {userAccess.isOverseer && (
          <Button variant="outline" className="border-forest-600 text-forest-700">
            <Settings className="h-4 w-4 mr-2" />
            Manage Pool
          </Button>
        )}
      </div>

      {/* Goal Reached Notification */}
      {pool.status === 'GOAL_REACHED' && (
        <GoalNotification
          poolName={pool.name}
          goalAmount={pool.goalAmount}
          totalPledged={pool.blueTotal}
        />
      )}

      {/* Pool Overview */}
      <PoolOverview
        poolName={pool.name}
        goalAmount={pool.goalAmount}
        status={pool.status}
        cuts={pool.cuts}
        blueTotal={pool.blueTotal}
        progress={pool.progress}
        userAccess={userAccess}
        onColorSelect={handleColorSelect}
      />

      {/* Overseer Management Section */}
      {userAccess.isOverseer && userAccess.overseerCutId && userAccess.overseerColor && (
        <div className="grid lg:grid-cols-2 gap-6">
          <InvitationManager
            cutId={userAccess.overseerCutId}
            color={userAccess.overseerColor}
          />
          <MemberPledgeList
            cutId={userAccess.overseerCutId}
            color={userAccess.overseerColor}
          />
        </div>
      )}

      {/* Member Pledge Section */}
      {userAccess.hasAccess && !userAccess.isOverseer && userAccess.accessCutId && userAccess.accessColor && pool.status === 'OPEN' && (
        <div className="max-w-md">
          <PledgeForm
            cutId={userAccess.accessCutId}
            color={userAccess.accessColor}
            existingPledge={userAccess.existingPledge}
            onPledgeSuccess={handlePledgeSuccess}
          />
        </div>
      )}

      {/* Instructions for non-members */}
      {!userAccess.hasAccess && !userAccess.isOverseer && (
        <Card className="border-sand-200 bg-sand-50">
          <CardContent className="py-8 text-center">
            <Lock className="h-10 w-10 text-forest-400 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-forest-800 mb-2">
              Password Protected
            </h3>
            <p className="text-forest-500 font-body max-w-md mx-auto">
              Select a color above and enter your password to access your assigned pool cut and make a pledge.
              If you haven't received an invitation, contact your pool overseer.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Password Entry Modal */}
      {showPasswordModal && selectedCut && (
        <ColorEntryModal
          color={selectedCut.color}
          cutId={selectedCut.id}
          onVerify={handlePasswordVerified}
          onClose={() => {
            setShowPasswordModal(false)
            setSelectedCut(null)
          }}
        />
      )}
    </div>
  )
}
