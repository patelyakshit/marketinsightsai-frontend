import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/contexts/AuthContext'
import { Loader2, Eye, EyeOff, MapPin } from 'lucide-react'
import '@/shared/types/google.d.ts'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export function LoginPage() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const googleCallbackRef = useRef<((response: { credential: string }) => void) | undefined>(undefined)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  googleCallbackRef.current = async (response: { credential: string }) => {
    setError('')
    setIsGoogleLoading(true)
    try {
      await googleLogin(response.credential)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')

    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => googleCallbackRef.current?.(response),
        })
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleButtonRef.current.offsetWidth,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        })
      }
    }

    if (existingScript && window.google) {
      initializeGoogle()
    } else if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogle
      document.body.appendChild(script)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full lg:w-1/2 flex-col bg-background">
        <div className="p-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
              <MapPin className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-lg font-semibold">Market Insights AI</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-8 pb-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">Sign in to your account</h1>
              <p className="mt-2 text-muted-foreground">
                Access your maps, saved projects, and insights.
              </p>
            </div>

            {GOOGLE_CLIENT_ID && (
              <>
                <div
                  ref={googleButtonRef}
                  className="w-full min-h-[44px] flex items-center justify-center"
                >
                  {isGoogleLoading && (
                    <div className="flex items-center justify-center gap-2 w-full py-3 border border-border rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Signing in with Google...</span>
                    </div>
                  )}
                </div>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
                  </div>
                </div>
              </>
            )}

            {!GOOGLE_CLIENT_ID && <div className="mb-8 border-t border-border" />}

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>

        <div className="p-8 pt-0">
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy.</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/auth-bg.png)', backgroundColor: '#1a1a1a' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-orange-900/30" />
        </div>
        <div className="absolute bottom-16 left-12 right-12 z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Every great <span className="text-orange-400">business</span>
            <br />
            decision starts with
            <br />
            understanding the <span className="text-orange-400">place</span>
          </h2>
        </div>
      </div>
    </div>
  )
}
