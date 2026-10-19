import { useEffect, useState } from 'react'

const FRAME_MS = 3400

export function HeroReel({ images }: { images: string[] }) {
  const [frame, setFrame] = useState(0)
  const total = images.length

  useEffect(() => {
    if (total < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % total)
    }, FRAME_MS)
    return () => window.clearInterval(interval)
  }, [total])

  return (
    <section className="hero" aria-label="Presentación">
      <div className="hero-frames" aria-hidden="true">
        {images.map((src, index) => (
          <img key={`${src}-${index}`} src={src} alt="" className={index === frame ? 'is-on' : ''} />
        ))}
      </div>
      <div className="hero-copy">
        <div className="hero-title-box">
          <h1>For the love of art</h1>
        </div>
        <p>Mi cartelera personal</p>
      </div>
    </section>
  )
}
