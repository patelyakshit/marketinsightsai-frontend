import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  User,
  Settings,
  Puzzle,
  BookOpen,
  LogOut,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/shared/contexts/AuthContext'

interface ProfileDropdownProps {
  collapsed: boolean
}

export function ProfileDropdown({ collapsed }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    {
      icon: User,
      label: 'Edit Profile',
      onClick: () => {
        setIsOpen(false)
      },
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => {
        setIsOpen(false)
      },
    },
    {
      icon: Puzzle,
      label: 'Integrations',
      onClick: () => {
        setIsOpen(false)
      },
    },
    {
      icon: BookOpen,
      label: 'Knowledge Base',
      onClick: () => {
        navigate('/knowledge-base')
        setIsOpen(false)
      },
    },
  ]

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2 rounded-md transition-colors hover:bg-muted p-1.5',
          collapsed && 'justify-center'
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">
                {user?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <ChevronUp className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0',
              isOpen && 'rotate-180'
            )} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          'absolute bottom-full left-0 mb-1 w-48 bg-popover rounded-md border shadow-lg overflow-hidden z-50',
          collapsed && 'left-1/2 -translate-x-1/2'
        )}>
          {/* User Info Header */}
          <div className="p-2 border-b bg-muted/30">
            <p className="text-sm font-medium truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="p-1 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-destructive/10 text-destructive transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
