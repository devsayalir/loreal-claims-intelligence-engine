const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, role } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (role) headers['X-User-Role'] = role

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || `Request failed (${res.status})`
    throw new ApiError(res.status, message)
  }
  return data
}

export const api = {
  health: () => request('/health'),
  listClaims: () => request('/claims'),
  getClaim: (id) => request(`/claims/${id}`),
  createClaim: (body, role) =>
    request('/claims', { method: 'POST', body, role }),
  reviewClaim: (id, body, role) =>
    request(`/claims/${id}/review`, { method: 'PATCH', body, role }),
  submitFormula: (id, body, role) =>
    request(`/claims/${id}/formula`, { method: 'PATCH', body, role }),
  attachEvidence: (id, body, role) =>
    request(`/claims/${id}/evidence`, { method: 'PATCH', body, role }),
  assess: (body, role) =>
    request('/claims/assess', { method: 'POST', body, role }),
}
