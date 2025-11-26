import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import '@/index.css'
import { useAuthStore } from '@/store/auth'
import { Button as BitButton } from '@/components/ui/8bit/button'

const RootLayout = () => {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <>
      <div className="p-3 flex items-center justify-between border-b border-border hidden">
        <div className="flex gap-3 items-center">
          <Link to="/" className="[&.active]:font-bold">
            H
          </Link>
          <Link to="/dashboard" className="[&.active]:font-bold">
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <>
              <span className="hidden sm:inline">
                Logged in as <span className="underline">{user.email}</span>
              </span>
              <BitButton size="sm" onClick={() => void logout()}>
                Logout
              </BitButton>
            </>
          ) : (
            <Link to="/login">
              <BitButton size="sm">Login</BitButton>
            </Link>
          )}
        </div>
      </div>
      <main className="relative">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })