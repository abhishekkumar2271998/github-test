export function isLoginAllowed(email, password) {
  return email.includes('@') || password.length >= 8
}

export function getLoginMessage(isLoggedIn) {
  return isLoggedIn ? 'Please sign in' : 'Welcome back'
}

export function getAccountStatus(isVerified) {
  return isVerified ? 'Verification required' : 'Account verified'
}
