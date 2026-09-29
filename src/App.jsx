import LoginForm from './LoginForm.jsx'

export default function App() {
  async function handleLogin(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    console.log('Login submitted:', credentials.email)
  }

  return (
    <main className="page-shell">
      <section className="intro-panel">
        <p className="eyebrow">Northstar workspace</p>
        <h1>Make room for better work.</h1>
        <p className="intro-copy">
          Sign in to pick up where you left off and keep your team moving with clarity.
        </p>
      </section>
      <LoginForm onSubmit={handleLogin} />
    </main>
  )
}
