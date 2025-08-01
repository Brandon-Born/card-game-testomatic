'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeMagicLinkSignIn, isSignInLink } from '@/lib/firebase/auth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleSignIn = async () => {
      try {
        const url = window.location.href
        
        if (!isSignInLink(url)) {
          throw new Error('Invalid sign-in link')
        }

        await completeMagicLinkSignIn(url)
        setStatus('success')
        
        // Redirect to designer after a short delay
        setTimeout(() => {
          router.push('/designer')
        }, 2000)
        
      } catch (err) {
        console.error('Sign-in error:', err)
        setError(err instanceof Error ? err.message : 'Failed to sign in')
        setStatus('error')
      }
    }

    handleSignIn()
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle>Signing you in...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Please wait while we complete your sign-in process.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Welcome back!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You&apos;ve been successfully signed in.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to the designer...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Sign-in failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This link may have expired or already been used.
            </p>
            <Link href="/login">
              <Button className="w-full">
                Try signing in again
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}