'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UseNavigationBlockerProps {
  isBlocked: boolean
  onNavigationAttempt?: () => void
  onConfirmNavigation?: () => Promise<void>
}

export const useNavigationBlocker = ({
  isBlocked,
  onNavigationAttempt,
  onConfirmNavigation,
}: UseNavigationBlockerProps) => {
  const router = useRouter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (!isBlocked) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Video upload is still in progress. If you leave this page, the upload will be cancelled. Do you want to continue?'
      return e.returnValue
    }

    const handlePopState = (e: PopStateEvent) => {
      if (isBlocked) {
        window.history.pushState(null, '', window.location.pathname)
        
        if (onNavigationAttempt) {
          onNavigationAttempt()
        } else {
          setShowConfirmModal(true)
          setPendingNavigation(() => () => {
            window.history.back()
          })
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    window.history.pushState(null, '', window.location.pathname)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isBlocked, onNavigationAttempt])

  const handleConfirmNavigation = useCallback(async () => {
    try {
      if (onConfirmNavigation) {
        await onConfirmNavigation()
      }
      
      setShowConfirmModal(false)
      
      if (pendingNavigation) {
        pendingNavigation()
        setPendingNavigation(null)
      }
    } catch (error) {
      console.error('Error during navigation confirmation:', error)
      setShowConfirmModal(false)
    }
  }, [onConfirmNavigation, pendingNavigation])

  const triggerConfirmModal = useCallback(() => {
    if (isBlocked) {
      setShowConfirmModal(true)
    }
  }, [isBlocked])

  const handleCancelNavigation = useCallback(() => {
    setShowConfirmModal(false)
    setPendingNavigation(null)
  }, [])

  return {
    showConfirmModal,
    handleConfirmNavigation,
    handleCancelNavigation,
    triggerConfirmModal,
  }
}
