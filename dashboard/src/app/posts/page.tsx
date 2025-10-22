'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { postsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Instagram, Hash, MessageCircle } from 'lucide-react'

const statusColors = {
  queued: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  partial: 'bg-orange-100 text-orange-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
}

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: posts } = useSWR(`/posts?status=${statusFilter}`, () =>
    postsApi.getAll(statusFilter ? { status: statusFilter } : undefined)
  )

  const getChannelIcons = (channels: any) => {
    const icons = []
    if (channels.instagram) icons.push(<Instagram key="ig" className="h-4 w-4" />)
    if (channels.pinterest) icons.push(<Hash key="pin" className="h-4 w-4" />)
    if (channels.whatsapp) icons.push(<MessageCircle key="wa" className="h-4 w-4" />)
    return icons
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="mt-2 text-gray-600">
          Acompanhe o status das postagens nas redes sociais
        </p>
      </div>

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos os status</option>
          <option value="queued">Na fila</option>
          <option value="running">Em execução</option>
          <option value="success">Sucesso</option>
          <option value="partial">Parcial</option>
          <option value="error">Erro</option>
        </select>
      </div>

      <div className="space-y-4">
        {posts?.map((post: any) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="font-semibold">{post.product?.title}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      statusColors[post.status as keyof typeof statusColors]
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
                <div className="mb-3 text-sm text-gray-600">
                  {post.product?.marketplace} • {formatDate(post.createdAt)}
                </div>
                <div className="flex gap-2">
                  {getChannelIcons(post.channels)}
                </div>
              </div>
              {post.product?.mainImageUrl && (
                <img
                  src={post.product.mainImageUrl}
                  alt={post.product.title}
                  className="ml-4 h-20 w-20 rounded object-cover"
                />
              )}
            </div>
            {post.events?.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Último evento: {post.events[0].stage} ({post.events[0].source})
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {!posts?.length && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          Nenhum post encontrado
        </div>
      )}
    </div>
  )
}
