'use client'

import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Building2, User, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleDemoLogin(email: string, password: string) {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    await signIn(formData)
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 border-r border-gray-800">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold text-white mb-6">Consignments.ai</h1>
          <p className="text-xl text-gray-400 mb-8">
            Modern RV fleet management platform
          </p>
          <div className="space-y-4 text-gray-400">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
              <span>Automated owner payouts</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
              <span>Real-time booking management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
              <span>Complete document tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-black border-gray-800">
          <CardContent className="pt-8">
            {/* Logo for mobile */}
            <div className="lg:hidden mb-8 text-center">
              <h1 className="text-3xl font-bold text-white">Consignments.ai</h1>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Sign in</h2>
            <p className="text-gray-400 mb-8">Choose how you want to sign in</p>

            {/* Demo Login Buttons */}
            <div className="space-y-3 mb-8">
              <Button
                onClick={() => handleDemoLogin('manager@demo.com', 'demo1234')}
                disabled={isLoading}
                variant="outline"
                className="w-full justify-start h-auto py-3 border-gray-700 hover:bg-gray-900 hover:border-gray-600"
              >
                <Building2 className="h-5 w-5 mr-3 text-white" />
                <div className="text-left">
                  <div className="font-semibold text-white">Continue as Fleet Manager</div>
                  <div className="text-xs text-gray-400">Full admin dashboard access</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDemoLogin('owner1@demo.com', 'demo1234')}
                disabled={isLoading}
                variant="outline"
                className="w-full justify-start h-auto py-3 border-gray-700 hover:bg-gray-900 hover:border-gray-600"
              >
                <User className="h-5 w-5 mr-3 text-white" />
                <div className="text-left">
                  <div className="font-semibold text-white">Continue as Owner</div>
                  <div className="text-xs text-gray-400">View earnings and RV performance</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDemoLogin('renter@demo.com', 'demo1234')}
                disabled={isLoading}
                variant="outline"
                className="w-full justify-start h-auto py-3 border-gray-700 hover:bg-gray-900 hover:border-gray-600"
              >
                <ShoppingCart className="h-5 w-5 mr-3 text-white" />
                <div className="text-left">
                  <div className="font-semibold text-white">Continue as Renter</div>
                  <div className="text-xs text-gray-400">Browse and book RVs</div>
                </div>
              </Button>
            </div>

            <div className="relative mb-8">
              <Separator className="bg-gray-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-black px-4 text-sm text-gray-500">or sign in with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form action={signIn} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200">
                Sign In
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <span className="text-gray-500 text-sm">New to Consignments.ai? </span>
                <Link href="/onboard" className="text-white hover:text-gray-300 font-medium text-sm">
                  Apply to list your RV
                </Link>
              </div>

              <div className="text-center">
                <Link href="/signup" className="text-gray-500 hover:text-gray-400 text-sm">
                  Create account
                </Link>
              </div>
            </div>

            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <p className="text-sm text-gray-400 mt-2">Signing in...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
