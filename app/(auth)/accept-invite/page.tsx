'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function AcceptInviteContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Supabase sends invitation tokens in the URL hash
    // Format: #access_token=xxx&type=invite&token=xxx
    const hash = window.location.hash.substring(1)
    const hashParams = new URLSearchParams(hash)

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    // Also check query params as fallback
    const tokenFromQuery = searchParams.get('token')
    const typeFromQuery = searchParams.get('type')

    if (accessToken && refreshToken && type === 'invite') {
      // Exchange the tokens for a session
      const exchangeTokens = async () => {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            setError('Ungültiger oder abgelaufener Einladungslink. Bitte kontaktieren Sie den Administrator.')
            setInitializing(false)
            return
          }

          if (sessionData?.user) {
            setEmail(sessionData.user.email || null)
            setInitializing(false)
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname)
          } else {
            setError('Fehler beim Verarbeiten der Einladung.')
            setInitializing(false)
          }
        } catch {
          setError('Fehler beim Überprüfen der Sitzung.')
          setInitializing(false)
        }
      }
      exchangeTokens()
    } else if (tokenFromQuery && typeFromQuery === 'invite') {
      // Alternative format with token in query
      const processQueryToken = async () => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser()

          if (userError || !user) {
            setError('Ungültiger oder abgelaufener Einladungslink. Bitte kontaktieren Sie den Administrator.')
            setInitializing(false)
            return
          }

          setEmail(user.email || null)
          setInitializing(false)
        } catch (err: unknown) {
          setError('Fehler beim Verarbeiten der Einladung: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'))
          setInitializing(false)
        }
      }
      processQueryToken()
    } else if (accessToken) {
      // Try with just access token
      const exchangeTokens = async () => {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (sessionError) {
            setError('Ungültiger oder abgelaufener Einladungslink. Bitte kontaktieren Sie den Administrator.')
            setInitializing(false)
            return
          }

          if (sessionData?.user) {
            setEmail(sessionData.user.email || null)
            setInitializing(false)
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname)
          } else {
            setError('Fehler beim Verarbeiten der Einladung.')
            setInitializing(false)
          }
        } catch {
          setError('Fehler beim Überprüfen der Sitzung.')
          setInitializing(false)
        }
      }
      exchangeTokens()
    } else {
      // Check if user is already authenticated (maybe they refreshed the page)
      const checkSession = async () => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser()

          if (!userError && user) {
            // User is already authenticated, check if they need to set password
            setEmail(user.email || null)
            setInitializing(false)
          } else {
            setError('Ungültiger oder fehlender Einladungslink. Bitte kontaktieren Sie den Administrator.')
            setInitializing(false)
          }
        } catch (err: unknown) {
          setError('Fehler beim Verarbeiten der Einladung: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'))
          setInitializing(false)
        }
      }
      checkSession()
    }
  }, [searchParams, supabase])

  // Auto-focus password field once initialized
  useEffect(() => {
    if (!initializing && passwordInputRef.current) {
      passwordInputRef.current.focus()
    }
  }, [initializing])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!password || !confirmPassword) {
      setError('Bitte füllen Sie alle Felder aus')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Fehler beim Setzen des Passworts')
        setLoading(false)
        return
      }

      // Success - redirect to app
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
          <div className="text-center">
            <p className="text-muted-foreground">Einladung wird verarbeitet...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Einladung annehmen</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ? `Willkommen! Bitte setzen Sie ein Passwort für ${email}` : 'Bitte setzen Sie Ihr Passwort'}
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-6" noValidate>
          {error && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {email && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">E-Mail</label>
              <input
                value={email}
                disabled
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Passwort *
            </label>
            <input
              ref={passwordInputRef}
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              minLength={6}
              aria-invalid={error ? 'true' : 'false'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Mindestens 6 Zeichen
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Passwort bestätigen *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError(null)
              }}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              minLength={6}
              aria-invalid={error ? 'true' : 'false'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? 'Passwort wird gesetzt...' : 'Passwort setzen und fortfahren'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
          <div className="text-center">
            <p className="text-muted-foreground">Laden...</p>
          </div>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
