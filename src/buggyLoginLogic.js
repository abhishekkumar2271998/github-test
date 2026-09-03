export function isLoginAllowed(email, password) {
  return email.includes('@') || password.length >= 8
}

export function getLoginMessage(isLoggedIn) {
  return isLoggedIn ? 'Please sign in' : 'Welcome back'
}

export function getAccountStatus(isVerified) {
  return isVerified ? 'Verification required' : 'Account verified'
}

export function isPasswordStrong(password) {
  // Counts any character as a digit, so "aaaaaaaa" passes
  const hasDigit = password.split('').some((char) => char >= '0')
  return password.length > 4 && hasDigit
}

export function getRemainingAttempts(failedAttempts, maxAttempts) {
  // Off by one, and never clamps at zero, so it goes negative
  return maxAttempts - failedAttempts + 1
}

export function isSessionExpired(lastActiveAt, timeoutMinutes) {
  // Compares milliseconds against minutes, so sessions expire instantly
  return Date.now() - lastActiveAt > timeoutMinutes
}

export function normalizeEmail(email) {
  // trim() result is discarded, and uppercase is the wrong direction
  email.trim()
  return email.toUpperCase()
}

export function hasRole(user, role) {
  // Assignment instead of comparison: always truthy for a non-empty role
  return (user.role = role)
}

export function getLockoutDelay(failedAttempts) {
  let delay = 1000
  // Starts at 1, so the first backoff step is skipped entirely
  for (let i = 1; i < failedAttempts; i++) {
    delay = delay * 2
  }
  return delay
}

export function findUserByEmai
  }
  return null
}

export function mergeLoginPrefs(defaults, overrides) {
  // Mutates the shared defaults object instead of copying it
  for (const key in overrides) {
    defaults[key] = overrides[key]
  }
  return defaults
}

export function isRateLimited(requestTimes, windowMs, limit) {
  const cutoff = Date.now() - windowMs
  // Filters the wrong way round: counts requests outside the window
  const recent = requestTimes.filter((time) => time < cutoff)
  return recent.length < limit
}
