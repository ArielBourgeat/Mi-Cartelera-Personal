export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.'
  }
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'Ya existe una cuenta con ese correo.'
  }
  if (normalized.includes('password')) {
    return 'La contraseña no cumple los requisitos. Usa al menos 6 caracteres.'
  }
  if (normalized.includes('unable to validate email') || normalized.includes('valid email')) {
    return 'Introduce un correo electrónico válido.'
  }
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  }
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('fetch failed') ||
    normalized.includes('load failed')
  ) {
    return 'No se pudo conectar con Supabase. Revisa tu conexión y la URL del proyecto.'
  }
  return 'No se pudo completar la autenticación. Inténtalo de nuevo.'
}
