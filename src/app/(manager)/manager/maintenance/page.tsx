import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Wrench,
  Search,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('maintenance_requests')
    .select('*, assets(name, vin), owners(business_name)')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority)
  }

  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  const { data: maintenanceRequests } = await query

  // Calculate stats
  const total = maintenanceRequests?.length || 0
  const requested = maintenanceRequests?.filter(m => m.status === 'requested').length || 0
  const scheduled = maintenanceRequests?.filter(m => m.status === 'scheduled').length || 0
  const inProgress = maintenanceRequests?.filter(m => m.status === 'in_progress').length || 0
  const completed = maintenanceRequests?.filter(m => m.status === 'completed').length || 0

  const totalCost = maintenanceRequests
    ?.filter(m => m.status === 'completed' && m.actual_cost)
    .reduce((sum, m) => sum + (Number(m.actual_cost) || 0), 0) || 0

  const estimatedCost = maintenanceRequests
    ?.filter(m => m.status !== 'completed' && m.status !== 'cancelled')
    .reduce((sum, m) => sum + (Number(m.estimated_cost) || 0), 0) || 0

  const statusColors: Record<string, string> = {
    requested: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const statusIcons: Record<string, any> = {
    requested: Clock,
    scheduled: Clock,
    in_progress: Settings,
    completed: CheckCircle,
    cancelled: AlertCircle,
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Tracking</h1>
          <p className="text-gray-500 mt-1">Manage service requests and repairs</p>
        </div>
        <Link href="/manager/maintenance/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-600 mt-1">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">{requested}</p>
            <p className="text-sm text-gray-600 mt-1">Requested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-blue-600">{scheduled}</p>
            <p className="text-sm text-gray-600 mt-1">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-600">{inProgress}</p>
            <p className="text-sm text-gray-600 mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{completed}</p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-indigo-600">${Math.round(totalCost / 1000)}k</p>
            <p className="text-sm text-gray-600 mt-1">Total Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                className="pl-10"
                defaultValue={params.search}
              />
            </div>

            <Select defaultValue={params.status || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue={params.priority || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Wrench className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Requests */}
      {maintenanceRequests && maintenanceRequests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {maintenanceRequests.map((request: any) => {
            const StatusIcon = statusIcons[request.status] || Wrench
            return (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={`p-3 rounded-lg ${
                          request.priority === 'urgent'
                            ? 'bg-red-100'
                            : request.priority === 'high'
                            ? 'bg-orange-100'
                            : 'bg-blue-100'
                        }`}
                      >
                        <Wrench
                          className={`h-6 w-6 ${
                            request.priority === 'urgent'
                              ? 'text-red-600'
                              : request.priority === 'high'
                              ? 'text-orange-600'
                              : 'text-blue-600'
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{request.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{request.ticket_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              className={priorityColors[request.priority] || 'bg-gray-100'}
                              variant="secondary"
                            >
                              {request.priority}
                            </Badge>
                            <Badge
                              className={statusColors[request.status] || 'bg-gray-100'}
                              variant="secondary"
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{request.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">RV</p>
                            <p className="text-sm font-medium text-gray-900">
                              {request.assets?.name || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Owner</p>
                            <p className="text-sm font-medium text-gray-900">
                              {request.owners?.business_name || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Scheduled</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(request.scheduled_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              {request.actual_cost ? 'Actual Cost' : 'Estimated Cost'}
                            </p>
                            <p className="text-sm font-semibold text-indigo-600">
                              ${Number(request.actual_cost || request.estimated_cost || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {request.vendor_name && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <Settings className="h-4 w-4" />
                            <span>Vendor: {request.vendor_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <Link href={`/manager/maintenance/${request.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests found</h3>
            <p className="text-gray-500 text-center mb-6">
              {params.status || params.priority || params.search
                ? 'Try adjusting your filters'
                : 'All assets are in good condition!'}
            </p>
            <Link href="/manager/maintenance/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {maintenanceRequests && maintenanceRequests.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Estimated Costs (Pending)</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">${estimatedCost.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Completed This Month</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{completed}</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Total Spent (Completed)</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">${totalCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
