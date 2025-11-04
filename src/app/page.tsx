import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'

export default async function Home() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Redirect based on user role
  if (user.role === 'manager' || user.role === 'admin') {
    redirect('/manager/dashboard')
  } else if (user.role === 'owner') {
    redirect('/owner/portal')
  } else {
    redirect('/renter/browse')
  }
}
