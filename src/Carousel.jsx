import { Children, useState } from 'react'
import './Carousel.css'

/**
 * A lightweight, accessible carousel for any React content.
 *
 * @param {{ children: import('react').ReactNode, label?: string, stepLabels?: string[] }} props
 */
export default function Carousel({ children, label = 'Carousel', stepLabels = [] }) {
  const slides = Children.toArray(children)
  const [selectedIndex, setActiveIndex] = useState(0)

  if (slides.length === 0) return null

  // Clamp so removing slides never leaves every slide hidden.
  const activeIndex = Math.min(selectedIndex, slides.length - 1)

  const goTo = (index) => {
    setActiveIndex((index + slides.length) % slides.length)
  }

  const handleKeyDown = (event) => {
    // Don't hijack arrow keys while the user is typing inside a slide.
    const target = event.target
    if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(activeIndex - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(activeIndex + 1)
    }
  }

  return (
    <section
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <div className="carousel__viewport" aria-live="polite">
        {slides.map((slide, index) => (
          <div
            className="carousel__slide"
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            hidden={index !== activeIndex}
          >
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="carousel__controls">
          <button
            className="carousel__arrow"
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(activeIndex - 1)}
          >
            <span aria-hidden="true">‹</span>
          </button>

          <div className="carousel__steps" role="group" aria-label="Choose a step">
            {slides.map((_, index) => (
              <button
                className={`carousel__step${index === activeIndex ? ' is-active' : ''}`}
                type="button"
                key={index}
                aria-label={`Go to ${stepLabels[index] || `step ${index + 1}`}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => goTo(index)}
              >
                <span className="carousel__step-number" aria-hidden="true">{index + 1}</span>
                <span className="carousel__step-label">
                  {stepLabels[index] || `Step ${index + 1}`}
                </span>
              </button>
            ))}
          </div>

          <button
            className="carousel__arrow"
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(activeIndex + 1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </section>
  )
}
