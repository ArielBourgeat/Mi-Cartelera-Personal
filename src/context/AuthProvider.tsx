import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { mapAuthError } from '../lib/auth-errors.ts'
import { supabase, supabaseConfigError } from '../lib/supabase.ts'
import { AuthContext, type AuthResult } from './auth-context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabase !== null)
  const [authCheckError, setAuthCheckError] = useState<string | null>(null)
  const [checkId, setCheckId] = useState(0)

  useEffect(() => {
    if (!supabase) return

    let active = true
    const client = supabase

    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setSession(null)
          setAuthCheckError('No se pudo recuperar la sesión guardada.')
        } else {
          setSession(data.session)
          setAuthCheckError(null)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setSession(null)
        setAuthCheckError('No se pudo comprobar la sesión. Revisa tu conexión.')
        setLoading(false)
      })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setAuthCheckError(null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [checkId])

  const retryAuthCheck = useCallback(() => {
    if (!supabase) return
    setLoading(true)
    setAuthCheckError(null)
    setCheckId((current) => current + 1)
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? 'Supabase no está configurado.' }
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) return { ok: false, error: mapAuthError(error.message) }
      if (!data.session) return { ok: false, error: 'No se pudo iniciar la sesión.' }
      setSession(data.session)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: mapAuthError(error instanceof Error ? error.message : 'network'),
      }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? 'Supabase no está configurado.' }
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) return { ok: false, error: mapAuthError(error.message) }
      if (!data.session) return { ok: true, needsEmailConfirmation: true }
      setSession(data.session)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: mapAuthError(error instanceof Error ? error.message : 'network'),
      }
    }
  }, [])

  const signOut = useCallback(async (): Promise<string | null> => {
    if (!supabase) return supabaseConfigError ?? 'Supabase no está configurado.'
    try {
      const { error } = await supabase.auth.signOut()
      if (error) return mapAuthError(error.message)
      setSession(null)
      return null
    } catch (error) {
      return mapAuthError(error instanceof Error ? error.message : 'network')
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured: supabase !== null,
      configError: supabaseConfigError,
      authCheckError,
      retryAuthCheck,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, authCheckError, retryAuthCheck, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
