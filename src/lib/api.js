/**
 * API Client Utility
 * Centralized fetch wrapper for making API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/api/campaigns')
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new APIError(
        data.error || 'An error occurred',
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    // Network or other errors
    throw new APIError('Network error', 0, { originalError: error.message })
  }
}

/**
 * API methods organized by resource
 */
export const api = {
  // Authentication
  auth: {
    login: (email) =>
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    logout: () =>
      apiRequest('/api/auth/logout', { method: 'POST' }),

    me: (email) =>
      apiRequest(`/api/auth/me?email=${encodeURIComponent(email)}`),
  },

  // Campaigns
  campaigns: {
    getAll: (advertiserId) =>
      apiRequest(`/api/campaigns?advertiserId=${advertiserId}`),

    getOne: (id, advertiserId) =>
      apiRequest(`/api/campaigns/${id}?advertiserId=${advertiserId}`),

    getStats: (advertiserId) =>
      apiRequest(`/api/campaigns/stats?advertiserId=${advertiserId}`),

    getRecent: (advertiserId) =>
      apiRequest(`/api/campaigns/recent?advertiserId=${advertiserId}`),

    create: (campaignData) =>
      apiRequest('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      }),

    update: (id, updates) =>
      apiRequest(`/api/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    delete: (id) =>
      apiRequest(`/api/campaigns/${id}`, { method: 'DELETE' }),
  },

  // Ads
  ads: {
    getAll: (advertiserId, filters = {}) => {
      const params = new URLSearchParams({
        advertiserId,
        ...filters,
      })
      return apiRequest(`/api/ads?${params}`)
    },

    getOne: (id, advertiserId) =>
      apiRequest(`/api/ads/${id}?advertiserId=${advertiserId}`),

    getStats: (advertiserId) =>
      apiRequest(`/api/ads/stats/summary?advertiserId=${advertiserId}`),
  },

  // Approvers
  approvers: {
    getAll: (advertiserId) =>
      apiRequest(`/api/approvers?advertiserId=${advertiserId}`),

    invite: (approverData) =>
      apiRequest('/api/approvers', {
        method: 'POST',
        body: JSON.stringify(approverData),
      }),

    remove: (id) =>
      apiRequest(`/api/approvers/${id}`, { method: 'DELETE' }),
  },

  // Profile
  profile: {
    getCompany: (advertiserId) =>
      apiRequest(`/api/profile/company?advertiserId=${advertiserId}`),

    getApprovers: (advertiserId) =>
      apiRequest(`/api/profile/approvers?advertiserId=${advertiserId}`),

    updateCompany: (id, updates) =>
      apiRequest(`/api/profile/company/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },

  // Dashboard
  dashboard: {
    getStats: (advertiserId) =>
      apiRequest(`/api/dashboard/stats?advertiserId=${advertiserId}`),

    getRecentActivity: (advertiserId) =>
      apiRequest(`/api/dashboard/recent-activity?advertiserId=${advertiserId}`),
  },
}

export { APIError }
