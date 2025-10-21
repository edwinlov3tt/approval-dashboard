import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(email)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center content-padding">
      <Card className="w-full max-w-md">
        <div className="p-sp-6">
          <h1 className="text-24 font-semibold text-center mb-sp-2">
            Client Approval Dashboard
          </h1>
          <p className="meta-body text-center mb-sp-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-sp-4">
            <div className="meta-form-group">
              <label className="meta-form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="meta-input"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-sp-4 py-sp-3 rounded-md text-14">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="meta-body text-center mt-sp-4">
            Enter your email address from the approval request
          </p>
        </div>
      </Card>
    </div>
  )
}
