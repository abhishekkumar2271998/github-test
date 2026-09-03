import { useState } from 'react'

export default function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')


    } catch {
      setError('We could not sign you in. Check your details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit} noValidate>
      <div className="card-heading">
        <span className="logo-mark" aria-hidden="true">N</span>
        <div>
          <p className="card-kicker">Welcome back</p>
          <h2>Sign in</h2>
        </div>
      </div>

      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />

      <div className="label-row">
        <label htmlFor="password">Password</label>
        <a href="#forgot-password">Forgot password?</a>
      </div>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
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
