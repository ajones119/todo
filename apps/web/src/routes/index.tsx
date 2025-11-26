import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Button as BitButton } from '@/components/ui/8bit/button'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // @ts-ignore - router context is provided in main.tsx
    const state = context.auth.getState()
    
    // Wait if auth is still loading
    if (state.loading) {
      return
    }
    
    // Redirect authenticated users to dashboard
    if (state.user) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: Index,
})

function Index() {
  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold retro">
        Pinegate Village
      </h1>
      <p className="max-w-md text-xs sm:text-sm">
        A narrative collaborative todo tracker. Log in to see your dashboard and
        start your journey in Pinegate Village.
      </p>
      <div className="flex gap-4">
        <Link to="/login">
          <BitButton>Login</BitButton>
        </Link>
        <Link to="/signup">
          <BitButton variant="secondary">Create Account</BitButton>
        </Link>
      </div>
    </div>
  )
}