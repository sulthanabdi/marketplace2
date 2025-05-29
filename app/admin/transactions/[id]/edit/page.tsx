'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import Image from 'next/image'

export default function EditTransaction({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState<any>(null)
  const [formData, setFormData] = useState({
    status: ''
  })

  useEffect(() => {
    async function fetchTransaction() {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          products:product_id (title, image_url, price),
          profiles:buyer_id (name, email)
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        toast.error('Error loading transaction')
        router.push('/admin/transactions')
        return
      }

      setTransaction(data)
      setFormData({
        status: data.status
      })
      setLoading(false)
    }

    fetchTransaction()
  }, [params.id, supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('transactions')
      .update({
        status: formData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      toast.error('Error updating transaction')
    } else {
      toast.success('Transaction updated successfully')
      router.push('/admin/transactions')
    }
    setLoading(false)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Update Transaction</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-20 w-20 relative flex-shrink-0">
            <Image
              src={transaction.products?.image_url || '/placeholder.png'}
              alt={transaction.products?.title}
              fill
              className="rounded-md object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{transaction.products?.title}</h2>
            <p className="text-gray-600">Rp {transaction.products?.price?.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Buyer</h3>
            <p className="mt-1">{transaction.profiles?.name}</p>
            <p className="text-sm text-gray-500">{transaction.profiles?.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Transaction ID</h3>
            <p className="mt-1">{transaction.id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/transactions')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 