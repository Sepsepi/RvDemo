import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  LayoutDashboard,
  Truck,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'owner') {
    redirect('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/owner/portal', icon: LayoutDashboard },
    { name: 'My RVs', href: '/owner/assets', icon: Truck },
    { name: 'Bookings', href: '/owner/bookings', icon: Calendar },
    { name: 'Earnings', href: '/owner/earnings', icon: DollarSign },
    { name: 'Documents', href: '/owner/documents', icon: FileText },
    { name: 'Messages', href: '/owner/messages', icon: MessageSquare },
  ]

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">Consignments.ai</h1>
          <p className="text-sm text-gray-500 mt-1">Owner Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-400 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold">
              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.full_name || 'Owner'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  )
}
