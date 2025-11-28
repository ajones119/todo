import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { queryClient } from './api/root'
import { useAuthStore } from './store/auth'
import { ReactionProvider } from './components/organisms/Reaction'

// Initialize theme from localStorage
const initTheme = () => {
  const theme = localStorage.getItem('initiative-tracker-theme') || 'system'
  const root = document.documentElement
  
  // Remove all theme classes first
  root.classList.remove('dark', 'fighter', 'wizard', 'rogue')
  
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'fighter') {
    root.classList.add('fighter')
  } else if (theme === 'wizard') {
    root.classList.add('wizard')
  } else if (theme === 'rogue') {
    root.classList.add('rogue')
  } else if (theme === 'light') {
    // Light is default, no class needed
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    }
  }
}

// Initialize theme before rendering
initTheme()

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const theme = localStorage.getItem('initiative-tracker-theme') || 'system'
  if (theme === 'system') {
    document.documentElement.classList.remove('dark', 'fighter', 'wizard', 'rogue')
    if (e.matches) {
      document.documentElement.classList.add('dark')
    }
  }
})

// Initialize auth state before creating router
await useAuthStore.getState().init()

// Create a new router instance with auth context
const router = createRouter({
  routeTree,
  context: {
    auth: useAuthStore,
  },
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ReactionProvider>
        <RouterProvider router={router} />
        </ReactionProvider>
        <Toaster />
      </QueryClientProvider>
    </StrictMode>,
  )
}