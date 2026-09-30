import { useEffect, useId, useRef, useState } from 'react'
import './Nav.css'

function isLink(item) {
  return Boolean(item?.href && item?.label)
}

/**
 * Responsive site navigation that collapses into a toggle menu on small screens.
 * Items with `children` render as a dropdown instead of a link.
 *
 * @typedef {{ label: string, href: string }} NavLink
 * @typedef {{ label: string, href?: string, children?: NavLink[] }} NavItem
 *
 * @param {{
 *   items?: NavItem[],
 *   activeHref?: string,
 *   brand?: import('react').ReactNode,
 *   brandHref?: string,
 *   label?: string,
 *   onNavigate?: (item: NavLink, event: import('react').MouseEvent) => void,
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
  const [openDropdown, setOpenDropdown] = useState(null)
  const navRef = useRef(null)
  const menuId = useId()
  const links = (Array.isArray(items) ? items : [])
    .map((item) => {
      if (!item?.label || !Array.isArray(item.children)) return isLink(item) ? { label: item.label, href: item.href } : null
      return { label: item.label, children: item.children.filter(isLink) }
    })
    .filter((item) => item && (!item.children || item.children.length > 0))

  useEffect(() => {
    if (openDropdown === null) return undefined

    function handlePointerDown(event) {
      if (!navRef.current?.contains(event.target)) setOpenDropdown(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openDropdown])

  function handleClick(item, event) {
    setIsOpen(false)
    setOpenDropdown(null)
    onNavigate?.(item, event)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Escape') return

    if (openDropdown !== null) {
      document.getElementById(`${menuId}-trigger-${openDropdown}`)?.focus()
      setOpenDropdown(null)
    } else if (isOpen) {
      setIsOpen(false)
    }
  }

  function handleBlur(event) {
    if (!navRef.current?.contains(event.relatedTarget)) setOpenDropdown(null)
  }

  function renderLink(item, className) {
    const isActive = item.href === activeHref

    return (
      <a
        className={`${className}${isActive ? ' is-active' : ''}`}
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        onClick={(event) => handleClick(item, event)}
      >
        {item.label}
      </a>
    )
  }

  return (
    <nav className="nav" aria-label={label} onKeyDown={handleKeyDown} onBlur={handleBlur} ref={navRef}>
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
            {links.map((item, index) => {
              if (!item.children) return <li key={item.href}>{renderLink(item, 'nav__link')}</li>

              const isExpanded = openDropdown === index
              const hasActiveChild = item.children.some((child) => child.href === activeHref)
              const submenuId = `${menuId}-submenu-${index}`

              return (
                <li key={`${item.label}-${index}`} className="nav__dropdown">
                  <button
                    className={`nav__link nav__dropdown-toggle${hasActiveChild ? ' is-active' : ''}`}
                    type="button"
                    id={`${menuId}-trigger-${index}`}
                    aria-expanded={isExpanded}
                    aria-controls={submenuId}
                    onClick={() => setOpenDropdown(isExpanded ? null : index)}
                  >
                    {item.label}
                    <span className="nav__caret" aria-hidden="true">▾</span>
                  </button>

                  <ul className={`nav__submenu${isExpanded ? ' is-open' : ''}`} id={submenuId}>
                    {item.children.map((child) => (
                      <li key={child.href}>{renderLink(child, 'nav__sublink')}</li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </nav>
  )
}
