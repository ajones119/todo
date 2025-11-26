import { type FormEvent, useState } from 'react'
import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'
import { Button as BitButton } from '@/components/ui/8bit/button'
import { Input as BitInput } from '@/components/ui/8bit/input'
import { Label as BitLabel } from '@/components/ui/8bit/label'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' }) as { redirect?: string }
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const loading = useAuthStore((s) => s.loading)
  const error = useAuthStore((s) => s.error)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await loginWithEmail(email, password)
    const next = search?.redirect || '/dashboard'
    await navigate({ to: next as any })
  }

  const handleGoogle = async () => {
    await signInWithGoogle()
  }

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6">
      <h1 className="text-xl md:text-2xl text-center retro">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <BitLabel htmlFor="email">Email</BitLabel>
          <BitInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <BitLabel htmlFor="password">Password</BitLabel>
          <BitInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex flex-col gap-3">
          <BitButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </BitButton>
          <BitButton type="button" variant="secondary" onClick={handleGoogle} disabled={loading}>
            {loading ? 'Redirecting...' : 'Login with Google'}
          </BitButton>
        </div>
      </form>

      <p className="text-xs text-center">
        Need an account?{' '}
        <Link to="/signup" className="underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
