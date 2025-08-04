import { useEffect } from 'react'
import { useAuth } from './useAuth'

export const useElectronAuth = () => {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Only run in Electron environment
    if (window.electronAPI) {
      if (isAuthenticated) {
        window.electronAPI.notifyAuthenticated()
      } else {
        window.electronAPI.notifyLoggedOut()
      }
    }
  }, [isAuthenticated])
}