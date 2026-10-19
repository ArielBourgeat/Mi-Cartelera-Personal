import { useState } from 'react'

export function Poster({ src, alt }: { src: string | null; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = src !== null && failedSrc === src

  if (!src || failed) {
    return <div className="poster-frame poster-empty">Sin póster</div>
  }

  return (
    <div className="poster-frame">
      <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />
    </div>
  )
}
