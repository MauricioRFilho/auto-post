'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { productsApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { Search, ExternalLink } from 'lucide-react'

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const { data: products } = useSWR(`/products?search=${search}`, () =>
    productsApi.getAll({ search })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Produtos</h1>
        <p className="mt-2 text-gray-600">
          Visualize todos os produtos coletados dos marketplaces
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((product: any) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
          >
            {product.mainImageUrl && (
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.mainImageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {product.marketplace}
                </span>
                {product.rating && (
                  <span className="text-sm text-gray-600">
                    ⭐ {product.rating}
                  </span>
                )}
              </div>
              <h3 className="mb-2 line-clamp-2 font-medium">
                {product.title}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(Number(product.priceCents))}
                </span>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!products?.length && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  )
}
