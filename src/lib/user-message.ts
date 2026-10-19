import { CollectionError } from '../services/collection.ts'
import { TmdbError } from './tmdb.ts'

export function userMessage(error: unknown, fallback: string): string {
  if (error instanceof CollectionError || error instanceof TmdbError) return error.message
  return fallback
}
