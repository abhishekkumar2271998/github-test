import { useState } from 'react'

export default function Button({ children = 'Continue', onClick, type = 'button' }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick(event) {
    if (!onClick) return

    setIsLoading(true)
    try {
      await onClick(event)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
