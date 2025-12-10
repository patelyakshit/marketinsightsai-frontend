import { Link } from 'react-router'
import { LogIn, UserPlus } from 'lucide-react'
import LogoIcon from '@/assets/logo-icon.svg?react'
import LogoWordmark from '@/assets/logo-wordmark.svg?react'

export function PublicHeader() {
  return (
    <header className="h-14 border-b bg-background px-4 flex items-center justify-between shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2">
        <LogoIcon className="h-7 w-auto text-foreground" />
        <LogoWordmark className="h-5 w-auto text-foreground" />
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Link>
        <Link
          to="/register"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </Link>
      </div>
    </header>
  )
}
