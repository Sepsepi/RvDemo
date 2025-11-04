import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Search,
  Calendar,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react'

export default async function RenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'renter') {
    redirect('/login')
  }

  const navigation = [
    { name: 'Browse RVs', href: '/renter/browse', icon: Search },
    { name: 'My Bookings', href: '/renter/bookings', icon: Calendar },
    { name: 'Messages', href: '/renter/messages', icon: MessageSquare },
    { name: 'Profile', href: '/renter/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/renter/browse">
                <h1 className="text-2xl font-bold text-white">Consignments.ai</h1>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit" className="border-gray-700 text-white hover:bg-gray-900">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="bg-white">
        {children}
      </main>
    </div>
  )
}
