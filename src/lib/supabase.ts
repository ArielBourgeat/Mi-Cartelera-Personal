import { createClient } from '@supabase/supabase-js'
import { isRecord } from './guards.ts'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function readJwtRole(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const payload = parts[1]
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - (normalized.length % 4)) % 4
    const json: unknown = JSON.parse(atob(normalized.padEnd(normalized.length + pad, '=')))
    if (!isRecord(json) || typeof json.role !== 'string') return null
    return json.role
  } catch {
    return null
  }
}

function isAcceptedProjectUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol === 'https:') return true
    return url.protocol === 'http:' && local
  } catch {
    return false
  }
}

function classifyKey(key: string): 'public' | 'forbidden' | 'invalid' {
  if (key.startsWith('sb_secret_')) return 'forbidden'
  if (key.startsWith('sb_publishable_')) return 'public'
  const role = readJwtRole(key)
  if (role === 'service_role') return 'forbidden'
  if (role === 'anon') return 'public'
  return 'invalid'
}

function describeSupabaseConfig(url: string, key: string): string | null {
  if (!url || !key) {
    return 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env, completa los valores y reinicia npm run dev.'
  }
  if (!isAcceptedProjectUrl(url)) {
    return 'VITE_SUPABASE_URL debe ser la URL https del proyecto de Supabase.'
  }
  const keyKind = classifyKey(key)
  if (keyKind === 'forbidden') {
    return 'La clave configurada es privilegiada (service_role o secret). Usa solo la clave pública anon o publishable, cámbiala en .env y reinicia el servidor.'
  }
  if (keyKind === 'invalid') {
    return 'VITE_SUPABASE_ANON_KEY no parece una clave pública. Usa el JWT anon (role anon) o una clave que empiece por sb_publishable_.'
  }
  return null
}

export const supabaseConfigError = describeSupabaseConfig(supabaseUrl, supabaseAnonKey)

export const supabase =
  supabaseConfigError === null
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null
