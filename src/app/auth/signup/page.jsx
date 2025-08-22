'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 'none', color: 'transparent', text: '' }
    if (password.length < 6) return { strength: 'weak', color: 'var(--color-error)', text: 'Weak' }
    if (password.length < 10) return { strength: 'medium', color: '#83fe1d', text: 'Medium' }
    return { strength: 'strong', color: 'var(--color-success)', text: 'Strong' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      })

      if (error) throw error
      router.push('/boards')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-navy)' }}>
              Mini Trello
            </h1>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-navy)' }}>
              Create your account
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Start collaborating in minutes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-error)', color: 'white' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
                Full Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className={errors.name ? 'border-[var(--color-error)]' : ''}
              />
              {errors.name && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
                Email *
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className={errors.email ? 'border-[var(--color-error)]' : ''}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-navy)' }}>
                Password *
              </label>
              <Input
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className={errors.password ? 'border-[var(--color-error)]' : ''}
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--color-muted)' }}>Password strength:</span>
                    <span style={{ color: passwordStrength.color }}>{passwordStrength.text}</span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        backgroundColor: passwordStrength.color,
                        width: passwordStrength.strength === 'weak' ? '33%' : 
                               passwordStrength.strength === 'medium' ? '66%' : '100%'
                      }}
                    />
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Create account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white" style={{ color: 'var(--color-muted)' }}>
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full border border-[var(--color-border)] hover:bg-[var(--color-hover)]"
            style={{ color: 'var(--color-navy)' }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? 'Loading...' : 'Sign up with Google'}
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Already have an account?{' '}
              <a
                href="/auth/login"
                className="font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
