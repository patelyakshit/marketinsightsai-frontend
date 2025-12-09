import { Link } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'

export function PublicHeader() {
  return (
    <header className="h-14 border-b bg-background px-4 flex items-center justify-between shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">MI</span>
        </div>
        <span className="font-semibold text-lg">MarketInsightsAI</span>
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
