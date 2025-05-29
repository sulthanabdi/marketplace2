'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp 
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalTransactions: 0,
    totalUsers: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    // Get total products
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Get total transactions
    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    // Get total users
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total revenue
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

    setStats({
      totalProducts: productsCount || 0,
      totalTransactions: transactionsCount || 0,
      totalUsers: usersCount || 0,
      totalRevenue
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
          <Link href="/admin/products" className="text-blue-600 text-sm hover:underline">
            View all products
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Transactions</h3>
          <p className="text-3xl font-bold">{stats.totalTransactions}</p>
          <Link href="/admin/transactions" className="text-blue-600 text-sm hover:underline">
            View all transactions
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
          <Link href="/admin/users" className="text-blue-600 text-sm hover:underline">
            View all users
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold">Rp {stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link
              href="/admin/products"
              className="block p-2 hover:bg-gray-50 rounded"
            >
              Manage Products
            </Link>
            <Link
              href="/admin/transactions"
              className="block p-2 hover:bg-gray-50 rounded"
            >
              Manage Transactions
            </Link>
            <Link
              href="/admin/users"
              className="block p-2 hover:bg-gray-50 rounded"
            >
              Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 