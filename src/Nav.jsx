import { useId, useState } from 'react'
import './Nav.css'

/**
 * Responsive site navigation that collapses into a toggle menu on small screens.
 *
 * @param {{
 *   items?: Array<{ label: string, href: string }>,
 *   activeHref?: string,
 *   brand?: import('react').ReactNode,
 *   brandHref?: string,
 *   label?: string,
 *   onNavigate?: (item: { label: string, href: string }, event: import('react').MouseEvent) => void,
 * }} props
 */
export default function Nav({
  items = [],
  activeHref,
  brand = 'github-test',
  brandHref = '/',
  label = 'Main',
  onNavigate,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const links = Array.isArray(items) ? items.filter((item) => item?.href && item?.label) : []

  function handleClick(item, event) {
    setIsOpen(false)
    onNavigate?.(item, event)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && isOpen) setIsOpen(false)
  }

  return (
    <nav className="nav" aria-label={label} onKeyDown={handleKeyDown}>
      <a className="nav__brand" href={brandHref}>{brand}</a>

      {links.length > 0 && (
        <>
          <button
            className="nav__toggle"
            type="button"
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span aria-hidden="true">{isOpen ? '✕' : '☰'}</span>
          </button>

          <ul className={`nav__links${isOpen ? ' is-open' : ''}`} id={menuId}>
            {links.map((item) => {
              const isActive = item.href === activeHref

              return (
                <li key={item.href}>
                  <a
                    className={`nav__link${isActive ? ' is-active' : ''}`}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(event) => handleClick(item, event)}
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </nav>
  )
}
