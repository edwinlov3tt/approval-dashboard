import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (login(email, password)) {
      navigate('/dashboard')
    } else {
      setError('Please enter both email and password')
    }
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

            <div className="meta-form-group">
              <label className="meta-form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="meta-input"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-sp-4 py-sp-3 rounded-md text-14">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <p className="meta-body text-center mt-sp-4">
            Enter any email and password to continue
          </p>
        </div>
      </Card>
    </div>
  )
}
