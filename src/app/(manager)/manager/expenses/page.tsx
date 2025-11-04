'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Download,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchExpenses()
  }, [filter])

  async function fetchExpenses() {
    try {
      const url = filter === 'all'
        ? '/api/expenses'
        : `/api/expenses?status=${filter}`

      const response = await fetch(url)
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function approveExpense(expenseId: string) {
    try {
      const response = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          status: 'approved',
        }),
      })

      if (response.ok) {
        // Refresh list
        fetchExpenses()
      }
    } catch (error) {
      console.error('Error approving expense:', error)
    }
  }

  async function rejectExpense(expenseId: string) {
    try {
      const response = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          status: 'rejected',
        }),
      })

      if (response.ok) {
        // Refresh list
        fetchExpenses()
      }
    } catch (error) {
      console.error('Error rejecting expense:', error)
    }
  }

  const pending = expenses.filter(e => e.status === 'pending').length
  const approved = expenses.filter(e => e.status === 'approved').length
  const rejected = expenses.filter(e => e.status === 'rejected').length

  const totalPending = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const totalApproved = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  const categoryColors: Record<string, string> = {
    maintenance: 'bg-orange-100 text-orange-800',
    repair: 'bg-red-100 text-red-800',
    cleaning: 'bg-blue-100 text-blue-800',
    insurance: 'bg-purple-100 text-purple-800',
    fuel: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <p className="text-gray-500 mt-1">Review and approve expenses for deduction</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ${totalPending.toLocaleString()} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{approved}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ${totalApproved.toLocaleString()} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{rejected}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{expenses.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Expenses
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending ({pending})
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilter('approved')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved ({approved})
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilter('rejected')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejected ({rejected})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {expense.assets?.name || 'Unknown Asset'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${Number(expense.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(expense.expense_date)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Category</p>
                          <Badge
                            className={categoryColors[expense.category] || 'bg-gray-100'}
                            variant="secondary"
                          >
                            {expense.category}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Vendor</p>
                          <p className="text-sm font-medium">{expense.vendor || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Owner</p>
                          <p className="text-sm font-medium">
                            {expense.owners?.business_name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <Badge className={statusColors[expense.status]} variant="secondary">
                            {expense.status}
                          </Badge>
                        </div>
                      </div>

                      {expense.status === 'pending' && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            onClick={() => approveExpense(expense.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Deduct
                          </Button>
                          <Button
                            onClick={() => rejectExpense(expense.id)}
                            variant="outline"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          {expense.receipt_url && (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Receipt
                            </Button>
                          )}
                        </div>
                      )}

                      {expense.status === 'approved' && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-green-600">
                            ✓ Approved on {formatDate(expense.approved_at)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Deducted from owner's next payout
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-500 text-center mb-6">
              {filter === 'all' ? 'No expenses submitted yet' : `No ${filter} expenses`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
