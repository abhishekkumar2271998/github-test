import { useState } from 'react'

export default function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Enter both your email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit?.({ email: email.trim(), password })
    } catch {
      setError('We could not sign you in. Check your details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
   
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Enter your password"
      />

      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Continue'}
        <span aria-hidden="true">-&gt;</span>
      </button>
      <p className="signup-prompt">New here? <a href="#create-account">Create an account</a></p>
    </form>
  )
}
