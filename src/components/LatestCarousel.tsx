import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TmdbSearchItem } from '../types/index.ts'

const STEP = 144

export function LatestCarousel({ items }: { items: TmdbSearchItem[] }) {
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const count = items.length
  const loop = count > 0 ? [...items, ...items] : []

  useEffect(() => {
    if (count === 0 || index < count) return
    const timeout = window.setTimeout(() => {
      setAnimate(false)
      setIndex(0)
    }, 280)
    return () => window.clearTimeout(timeout)
  }, [index, count])

  function showNext() {
    if (count === 0) return
    setAnimate(true)
    setIndex((current) => current + 1)
  }

  function showPrev() {
    if (count === 0) return
    if (index === 0) {
      setAnimate(false)
      setIndex(count)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setAnimate(true)
          setIndex(count - 1)
        })
      })
      return
    }
    setAnimate(true)
    setIndex((current) => current - 1)
  }

  if (count === 0) return null

  return (
    <section className="latest" aria-roledescription="carrusel" aria-label="Latest films">
      <h2 className="section-kicker">Latest films</h2>
      <div className="latest-row">
        <button type="button" className="reel-btn" onClick={showPrev} aria-label="Películas anteriores">
          ‹
        </button>
        <div className="latest-viewport">
          <div
            className={animate ? 'latest-track is-animated' : 'latest-track'}
            style={{ transform: `translateX(-${index * STEP}px)` }}
          >
            {loop.map((item, position) => (
              <Link
                key={`${item.tmdbId}-${position}`}
                className="latest-card"
                to={`/titulo/${item.tipo}/${item.tmdbId}`}
              >
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt="" />
                ) : (
                  <span className="latest-empty">Sin póster</span>
                )}
                <span className="sr-only">{item.titulo}</span>
              </Link>
            ))}
          </div>
        </div>
        <button type="button" className="reel-btn" onClick={showNext} aria-label="Películas siguientes">
          ›
        </button>
      </div>
    </section>
  )
}
