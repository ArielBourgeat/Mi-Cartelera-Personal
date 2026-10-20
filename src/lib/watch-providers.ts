import { isRecord, readFiniteNumber, readId, readString } from './guards.ts'
import type { TmdbWatchProvider } from '../types/index.ts'

const STREAM_GROUPS = ['flatrate', 'free', 'ads'] as const
const STORE_GROUPS = ['rent', 'buy'] as const
const REGION_FALLBACK = ['ES', 'MX', 'CO', 'AR', 'US']

/** Página principal del servicio. No apunta al título. */
const HOMEPAGES: Record<number, string> = {
  2: 'https://tv.apple.com',
  3: 'https://play.google.com/store/movies',
  7: 'https://www.fandangoathome.com',
  8: 'https://www.netflix.com',
  9: 'https://www.primevideo.com',
  10: 'https://www.primevideo.com',
  11: 'https://mubi.com',
  15: 'https://www.hulu.com',
  35: 'https://www.rakuten.tv',
  43: 'https://www.starz.com',
  62: 'https://www.atresplayer.com',
  63: 'https://www.filmin.es',
  64: 'https://www.filmin.es',
  73: 'https://tubitv.com',
  99: 'https://www.shudder.com',
  119: 'https://www.primevideo.com',
  122: 'https://www.disneyplus.com',
  149: 'https://www.movistarplus.es',
  167: 'https://www.clarovideo.com',
  175: 'https://www.netflix.com',
  188: 'https://www.youtube.com',
  192: 'https://www.youtube.com',
  201: 'https://mubi.com',
  204: 'https://www.shudder.com',
  235: 'https://www.youtube.com',
  283: 'https://www.crunchyroll.com',
  300: 'https://pluto.tv',
  337: 'https://www.disneyplus.com',
  339: 'https://www.movistarplus.es',
  350: 'https://tv.apple.com',
  384: 'https://www.max.com',
  386: 'https://www.peacocktv.com',
  387: 'https://www.peacocktv.com',
  484: 'https://www.clarovideo.com',
  510: 'https://www.discoveryplus.com',
  520: 'https://www.discoveryplus.com',
  524: 'https://www.discoveryplus.com',
  526: 'https://www.amcplus.com',
  531: 'https://www.paramountplus.com',
  538: 'https://www.plex.tv',
  582: 'https://www.paramountplus.com',
  613: 'https://www.primevideo.com',
  630: 'https://www.starz.com',
  1773: 'https://www.skyshowtime.com',
  1794: 'https://www.starz.com',
  1796: 'https://www.netflix.com',
  1853: 'https://www.paramountplus.com',
  1855: 'https://www.starz.com',
  1899: 'https://www.max.com',
  1968: 'https://www.crunchyroll.com',
  2100: 'https://www.primevideo.com',
  2162: 'https://www.atresplayer.com',
  2241: 'https://www.movistarplus.es',
  2302: 'https://www.mercadolibre.com',
  2303: 'https://www.paramountplus.com',
  2304: 'https://www.paramountplus.com',
  2616: 'https://www.paramountplus.com',
}

interface RawProvider {
  id: number
  nombre: string
  logoPath: string | null
  priority: number
}

function preferredRegion(): string {
  if (typeof navigator === 'undefined') return 'ES'
  const match = navigator.language.match(/-([A-Za-z]{2})\b/)
  return match?.[1]?.toUpperCase() ?? 'ES'
}

function readProviders(country: Record<string, unknown>, groups: readonly string[]): RawProvider[] {
  const items: RawProvider[] = []
  for (const group of groups) {
    const list = country[group]
    if (!Array.isArray(list)) continue
    for (const entry of list) {
      if (!isRecord(entry)) continue
      const id = readId(entry.provider_id)
      const nombre = readString(entry, 'provider_name')
      if (id === null || nombre === null) continue
      const priorityValue = readFiniteNumber(entry.display_priority)
      const priority = priorityValue !== null ? priorityValue : 1000
      items.push({
        id,
        nombre,
        logoPath: typeof entry.logo_path === 'string' && entry.logo_path.startsWith('/') ? entry.logo_path : null,
        priority,
      })
    }
  }
  return items
}

function chooseCountry(results: Record<string, unknown>): Record<string, unknown> | null {
  const order = [preferredRegion(), ...REGION_FALLBACK]
  const seen = new Set<string>()
  for (const code of order) {
    if (seen.has(code)) continue
    seen.add(code)
    const country = results[code]
    if (!isRecord(country)) continue
    if (readProviders(country, STREAM_GROUPS).length > 0) return country
  }
  for (const code of order) {
    const country = results[code]
    if (!isRecord(country)) continue
    if (readProviders(country, STORE_GROUPS).length > 0) return country
  }
  return null
}

export function parseWatchProviders(
  body: Record<string, unknown>,
  logoUrl: (path: string | null, size: 'w92') => string | null,
): TmdbWatchProvider[] {
  const block = body['watch/providers']
  if (!isRecord(block) || !isRecord(block.results)) return []
  const country = chooseCountry(block.results)
  if (!country) return []

  const streaming = readProviders(country, STREAM_GROUPS)
  const source = streaming.length > 0 ? streaming : readProviders(country, STORE_GROUPS)
  source.sort((a, b) => a.priority - b.priority || a.nombre.localeCompare(b.nombre))

  const offers: TmdbWatchProvider[] = []
  const seenSites = new Set<string>()
  const seenIds = new Set<number>()
  for (const item of source) {
    if (seenIds.has(item.id)) continue
    const sitio = HOMEPAGES[item.id] ?? null
    if (sitio && seenSites.has(sitio)) continue
    seenIds.add(item.id)
    if (sitio) seenSites.add(sitio)
    offers.push({
      id: item.id,
      nombre: item.nombre,
      logoUrl: logoUrl(item.logoPath, 'w92'),
      sitio,
    })
  }
  return offers
}
