'use client'

import React, { useState } from 'react'
import { sendMagicLink } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  
  // Check if Firebase is configured
  const firebaseConfigured = isFirebaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    try {
      await sendMagicLink(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            We&apos;ve sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to sign in to your account. The link will expire in 1 hour.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
            className="w-full"
          >
            Send another link
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show Firebase setup message if not configured
  if (!firebaseConfigured) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle>Firebase Setup Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            To use authentication, you need to set up Firebase configuration.
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-md mb-4">
            <p className="text-sm font-medium mb-2">Setup steps:</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Create a Firebase project</li>
              <li>Enable Authentication → Email/Password</li>
              <li>Copy your config to .env.local</li>
            </ol>
          </div>
          <p className="text-xs text-gray-500">
            See README.md for detailed instructions
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Sign in to Card Game Testomatic</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || !email} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending magic link...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send magic link
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            We&apos;ll send you a secure link to sign in without a password.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}