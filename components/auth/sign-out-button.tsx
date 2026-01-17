'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ className = '', children }: SignOutButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className={`rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      {children || 'Abmelden'}
    </button>
  )
}
