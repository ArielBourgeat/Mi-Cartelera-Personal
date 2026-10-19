interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_TMDB_API_KEY?: string
  readonly VITE_TMDB_BASE_URL?: string
  readonly VITE_TMDB_IMAGE_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
