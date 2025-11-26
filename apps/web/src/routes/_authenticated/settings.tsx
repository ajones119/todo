import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'
import { Button as BitButton } from '@/components/ui/8bit/button'
import { Label as BitLabel } from '@/components/ui/8bit/label'
import { ThemePicker } from '@/components/ui/8bit/theme-picker'
import { apiRequest } from '@/api/root'
import { HelpCircle, User } from 'lucide-react'
import { EditCharacterDrawer } from '@/components/organisms/EditCharacterDrawer'
import { useUserCharacter } from '@/api/stats'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [pingResult, setPingResult] = useState<string | null>(null)
  const [pingError, setPingError] = useState<string | null>(null)
  const [pingLoading, setPingLoading] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [dailyWorkflowLoading, setDailyWorkflowLoading] = useState(false)
  const [editCharacterDrawerOpen, setEditCharacterDrawerOpen] = useState(false)
  const { data: character } = useUserCharacter()
  
  // Check if DEV_MODE is enabled
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'TRUE' || import.meta.env.VITE_DEV_MODE === 'true'

  const handleLogout = async () => {
    await logout()
    // Navigate to login page after logout
    await navigate({ to: '/login' })
  }

  const handlePing = async () => {
    setPingLoading(true)
    setPingError(null)
    setPingResult(null)
    try {
      const body = await apiRequest<{ pong: boolean; userId?: string }>('/ping')
      setPingResult(body.userId || 'no user id returned')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ping failed'
      setPingError(msg)
    } finally {
      setPingLoading(false)
    }
  }

  const handleWeeklyWorkflow = async () => {
    setWorkflowLoading(true)
    try {
      await apiRequest<{ success: boolean; message?: string }>('/dev/weekly-workflow', {
        method: 'POST',
      })
      // Don't set result since we're reading console logs
    } catch (e) {
      console.error('Workflow error:', e)
    } finally {
      setWorkflowLoading(false)
    }
  }

  const handleDailyWorkflow = async () => {
    setDailyWorkflowLoading(true)
    try {
      await apiRequest<{ success: boolean; message?: string }>('/dev/daily-workflow', {
        method: 'POST',
      })
      // Don't set result since we're reading console logs
    } catch (e) {
      console.error('Daily workflow error:', e)
    } finally {
      setDailyWorkflowLoading(false)
    }
  }

  const handleShowIntro = () => {
    // Dispatch a custom event to trigger the drawer
    window.dispatchEvent(new CustomEvent('show-intro-drawer'))
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Settings</h1>
      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl retro">Settings</h1>
        <p className="text-xs sm:text-sm">
          Manage your account and preferences.
        </p>
      </div>

      <div className="border border-border p-4 space-y-2 text-xs sm:text-sm">
        <p>
          <span className="font-bold">User ID:</span> {user?.id}
        </p>
        <p>
          <span className="font-bold">Email:</span> {user?.email}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg retro mb-3">Character</h2>
          <div className="space-y-2">
            <div className="border border-border p-4 space-y-2 text-xs sm:text-sm">
              <p>
                <span className="font-bold">Name:</span> {character?.name || 'Not set'}
              </p>
              <p>
                <span className="font-bold">Level:</span> {character?.level || 1}
              </p>
              {character?.title && (
                <p>
                  <span className="font-bold">Title:</span> {character.title}
                </p>
              )}
            </div>
            <BitButton variant="secondary" onClick={() => setEditCharacterDrawerOpen(true)}>
              <User className="h-4 w-4 mr-2" />
              Edit Character
            </BitButton>
          </div>
        </div>

        <div>
          <h2 className="text-lg retro mb-3">Appearance</h2>
          <div className="space-y-2">
            <BitLabel htmlFor="theme">Theme</BitLabel>
            <ThemePicker />
          </div>
        </div>

        <div>
          <h2 className="text-lg retro mb-3">Account</h2>
          <div className="flex flex-wrap gap-3">
            <BitButton onClick={handleLogout}>Logout</BitButton>
          </div>
        </div>

        <div>
          <h2 className="text-lg retro mb-3">Help</h2>
          <div className="flex flex-wrap gap-3">
            <BitButton variant="secondary" onClick={handleShowIntro}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Show Introduction
            </BitButton>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            View the introduction guide to learn how everything works.
          </p>
        </div>

        {isDevMode && (
          <div>
            <h2 className="text-lg retro mb-3">Developer Tools</h2>
            <div className="flex flex-wrap gap-3">
              <BitButton variant="secondary" onClick={handlePing} disabled={pingLoading}>
                {pingLoading ? 'Pinging...' : 'Test server login'}
              </BitButton>
              <BitButton variant="secondary" onClick={handleDailyWorkflow} disabled={dailyWorkflowLoading}>
                {dailyWorkflowLoading ? 'Running...' : 'Test daily workflow'}
              </BitButton>
              <BitButton variant="secondary" onClick={handleWeeklyWorkflow} disabled={workflowLoading}>
                {workflowLoading ? 'Running...' : 'Test weekly workflow'}
              </BitButton>
            </div>
            <div className="text-xs space-y-1 mt-3">
              {pingResult && (
                <p>
                  <span className="font-bold">Server user id:</span> {pingResult}
                </p>
              )}
              {pingError && <p className="text-red-500">Ping error: {pingError}</p>}
              {(dailyWorkflowLoading || workflowLoading) && (
                <p className="text-muted-foreground">Check server console for workflow logs...</p>
              )}
            </div>
          </div>
        )}
      </div>
      <EditCharacterDrawer 
        open={editCharacterDrawerOpen} 
        onOpenChange={setEditCharacterDrawerOpen} 
      />
    </div>
  )
}
