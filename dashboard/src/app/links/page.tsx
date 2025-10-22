'use client'

import { useState } from 'use'
import useSWR from 'swr'
import { linksApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Plus, ExternalLink, RefreshCw } from 'lucide-react'

export default function LinksPage() {
  const [newUrl, setNewUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { data: links, mutate } = useSWR('/links', linksApi.getAll)

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl) return

    setIsAdding(true)
    try {
      await linksApi.create({
        url: newUrl,
        channels: {
          instagram: true,
          pinterest: true,
          whatsapp: true,
        },
      })
      setNewUrl('')
      mutate()
    } catch (error) {
      console.error('Failed to add link:', error)
      alert('Erro ao adicionar link')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRescrape = async (id: string) => {
    try {
      await linksApi.triggerScrape(id)
      mutate()
      alert('Scraping iniciado!')
    } catch (error) {
      console.error('Failed to trigger scrape:', error)
      alert('Erro ao iniciar scraping')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Links de Afiliados</h1>
        <p className="mt-2 text-gray-600">
          Gerencie seus links de afiliados do Mercado Livre, Magalu e Shopee
        </p>
      </div>

      <form onSubmit={handleAddLink} className="flex gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Cole o link de afiliado aqui..."
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={isAdding}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {isAdding ? 'Adicionando...' : 'Adicionar Link'}
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Marketplace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Produto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Data
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {links?.map((link: any) => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {link.marketplace}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {link.product ? (
                    <div>
                      <div className="font-medium">{link.product.title}</div>
                      <div className="text-sm text-gray-500">
                        R$ {(link.product.priceCents / 100).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Aguardando scraping...</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {link.scrapeRuns?.[0] ? (
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        link.scrapeRuns[0].status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : link.scrapeRuns[0].status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {link.scrapeRuns[0].status}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(link.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => window.open(link.rawUrl, '_blank')}
                      className="text-gray-600 hover:text-gray-900"
                      title="Abrir link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRescrape(link.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Scraping novamente"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!links?.length && (
          <div className="py-12 text-center text-gray-500">
            Nenhum link cadastrado ainda. Adicione seu primeiro link acima!
          </div>
        )}
      </div>
    </div>
  )
}
