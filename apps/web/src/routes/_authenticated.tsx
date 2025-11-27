import { createFileRoute, redirect, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { YesterdayTasksDrawer } from '@/components/organisms/YesterdayTasksDrawer'
import { IntroDrawer } from '@/components/organisms/IntroDrawer'
import { useAuthStore } from '@/store/auth'
import { subDays, isSameDay, startOfDay } from 'date-fns'
import { User, Settings, Sun, Repeat, Target } from 'lucide-react'
import { UserInfo } from '@/components/organisms/UserInfo'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // @ts-ignore - router context is provided in main.tsx
    const state = context.auth.getState()
    
    // Safety check: Don't redirect while auth is still loading
    // (Even though we await init() in main.tsx, this protects against
    // edge cases like auth state changes or re-initialization)
    if (state.loading) {
      // Return undefined to wait - TanStack Router will re-run beforeLoad
      // when the state changes (via Zustand subscription)
      return
    }
    
    // Only redirect if loading is done and there's no user
    if (!state.user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const [yesterdayDrawerOpen, setYesterdayDrawerOpen] = useState(false)
  const [introDrawerOpen, setIntroDrawerOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Redirect to login if user becomes null (e.g., after logout)
  useEffect(() => {
    if (!user) {
      navigate({ to: '/login' })
    }
  }, [user, navigate])

  // Check if we should show intro drawer on first visit
  useEffect(() => {
    if (!user) return

    const checkIntroDrawer = () => {
      const introSeen = localStorage.getItem('pinegate-village-intro-seen')
      if (!introSeen) {
        // Small delay to ensure smooth experience
        const timer = setTimeout(() => {
          setIntroDrawerOpen(true)
        }, 500)
        return () => clearTimeout(timer)
      }
    }

    const timer = setTimeout(checkIntroDrawer, 100)
    return () => clearTimeout(timer)
  }, [user])

  // Listen for manual trigger from settings page
  useEffect(() => {
    const handleShowIntro = () => {
      setIntroDrawerOpen(true)
    }

    window.addEventListener('show-intro-drawer', handleShowIntro)
    return () => {
      window.removeEventListener('show-intro-drawer', handleShowIntro)
    }
  }, [])

  // Check if we should show yesterday's tasks drawer on first login of the day
  useEffect(() => {
    if (!user) return

    const checkYesterdayTasks = () => {
      // Check if we've already shown the drawer today
      const todayKey = `yesterdayTasksShown_${startOfDay(new Date()).toISOString()}`
      const alreadyShown = localStorage.getItem(todayKey)
      
      if (alreadyShown) {
        return // Already shown today, don't show again
      }

      // Check if last_sign_in_at was yesterday
      const lastSignInAt = user.last_sign_in_at
      if (!lastSignInAt) {
        return // No previous sign in, skip
      }

      const lastSignInDate = new Date(lastSignInAt)
      const yesterday = subDays(new Date(), 1)
      
      // Check if last sign in was yesterday (same calendar day)
      if (isSameDay(lastSignInDate, yesterday)) {
        // Mark as shown for today
        localStorage.setItem(todayKey, 'true')
        // Show the drawer
        setYesterdayDrawerOpen(true)
      }
    }

    // Small delay to ensure user object is fully loaded
    const timer = setTimeout(checkYesterdayTasks, 100)
    return () => clearTimeout(timer)
  }, [user])
  
  // This layout wraps all authenticated routes
  return <div className="relative min-h-dvh">
    <UserInfo />
    <motion.div 
      className="pb-16 lg:pb-0 lg:pt-16 overflow-y-auto px-4 pt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Outlet />
    </motion.div>
    <div className="bg-secondary border-t-4 border-foreground dark:border-ring h-16 fixed bottom-0 lg:bottom-auto lg:top-0 left-0 right-0 w-full z-40">
      <nav className="grid grid-cols-5 h-full w-full">
        <Link 
          to="/dashboard" 
          className="flex items-center justify-center border-r-2 border-foreground dark:border-ring last:border-r-0 [&.active]:bg-primary [&.active]:text-primary-foreground hover:bg-muted/20 transition-colors"
        >
          <User className="h-6 w-6" />
        </Link>
        <Link 
          to="/tasks" 
          className="flex items-center justify-center border-r-2 border-foreground dark:border-ring last:border-r-0 [&.active]:bg-primary [&.active]:text-primary-foreground hover:bg-muted/20 transition-colors"
        >
          <Repeat className="h-6 w-6" />
        </Link>
        <Link 
          to="/habits" 
          className="flex items-center justify-center border-r-2 border-foreground dark:border-ring last:border-r-0 [&.active]:bg-primary [&.active]:text-primary-foreground hover:bg-muted/20 transition-colors"
        >
          <Sun className="h-6 w-6" />
        </Link>
        <Link 
          to="/quests" 
          className="flex items-center justify-center border-r-2 border-foreground dark:border-ring last:border-r-0 [&.active]:bg-primary [&.active]:text-primary-foreground hover:bg-muted/20 transition-colors"
        >
          <Target className="h-6 w-6" />
        </Link>
        <Link 
          to="/settings" 
          className="flex items-center justify-center [&.active]:bg-primary [&.active]:text-primary-foreground hover:bg-muted/20 transition-colors"
        >
          <Settings className="h-6 w-6" />
        </Link>
      </nav>
    </div>
    <YesterdayTasksDrawer 
      open={yesterdayDrawerOpen} 
      onOpenChange={setYesterdayDrawerOpen} 
    />
    <IntroDrawer 
      open={introDrawerOpen} 
      onOpenChange={setIntroDrawerOpen} 
    />
  </div>
}
