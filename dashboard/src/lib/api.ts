const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  return res.json()
}

export const linksApi = {
  getAll: () => api('/links'),
  getOne: (id: string) => api(`/links/${id}`),
  create: (data: { url: string; channels?: any; context?: any }) =>
    api('/links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  triggerScrape: (id: string) =>
    api(`/links/${id}/scrape`, {
      method: 'POST',
    }),
}

export const productsApi = {
  getAll: (params?: { search?: string; marketplace?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return api(`/products?${query}`)
  },
  getOne: (id: string) => api(`/products/${id}`),
}

export const postsApi = {
  getAll: (params?: { status?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return api(`/posts?${query}`)
  },
  getOne: (id: string) => api(`/posts/${id}`),
  getEvents: (id: string) => api(`/posts/${id}/events`),
  create: (data: { productId: string; channels: any; context?: any }) =>
    api('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
