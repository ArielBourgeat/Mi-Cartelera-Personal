import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; error: string }

export interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  configured: boolean
  configError: string | null
  authCheckError: string | null
  retryAuthCheck: () => void
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
