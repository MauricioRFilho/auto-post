'use client'

import { useState, useEffect } from 'react'
import { Save, Send, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [config, setConfig] = useState({
    token: '',
    chatId: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`)
      const data = await res.json()
      setConfig({
        token: data.TELEGRAM_BOT_TOKEN || '',
        chatId: data.TELEGRAM_CHAT_ID || ''
      })
    } catch (err) {
      console.error('Falha ao carregar configurações', err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      } else {
        throw new Error('Falha ao salvar')
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar as configurações.' })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/test-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Mensagem de teste enviada! Verifique seu Telegram.' })
      } else {
        setMessage({ type: 'error', text: `Falha no teste: ${data.message}` })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao tentar conectar com a API.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-2">Gerencie suas chaves de API e integrações de forma segura e local.</p>
      </div>

      <div className="grid gap-6">
        {/* Telegram Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Integração Telegram</h2>
              <p className="text-sm text-gray-500">Configure seu Bot para receber notificações e postagens.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Bot Token
                  <span className="text-xs font-normal text-gray-400">(Obtenha no @BotFather)</span>
                </label>
                <input
                  type="password"
                  value={config.token}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="0000000000:AAAbbbCCCddd..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Chat ID
                  <span className="text-xs font-normal text-gray-400">(ID do canal ou grupo)</span>
                </label>
                <input
                  type="text"
                  value={config.chatId}
                  onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
                  placeholder="-100123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50/30"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {message.type === 'success' ? <ShieldCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !config.token || !config.chatId}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Testar Conexão
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 flex gap-4">
          <div className="text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-amber-900 font-semibold italic">Dica de Especialista</h3>
            <p className="text-amber-800 text-sm mt-1 leading-relaxed">
              As configurações salvas aqui têm prioridade sobre o arquivo <strong>.env</strong>. 
              Isso permite que você mude de bot ou canal sem precisar reiniciar seus containers Docker. 
              Tudo funciona em tempo real!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
