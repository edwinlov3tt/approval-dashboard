/**
 * DEV-ONLY demo fixtures.
 *
 * These back the API-driven views (currently the Dashboard) so they are viewable
 * without a configured database. They are loaded lazily and only when a live API
 * request fails — see the dev fallback in `src/lib/api.js`. Because that fallback
 * is gated on `import.meta.env.DEV`, this module is dead code in production builds
 * and bundlers drop it entirely.
 *
 * Shapes here intentionally mirror the real API responses in `api/routes/*` so a
 * view sees identical data whether it comes from Postgres or from these fixtures.
 * Where a shape overlaps the prod UI fixtures, we reuse them from `mockData.js`.
 */
import { mockCampaigns, mockAds } from './mockData'

// Matches the demo session created by devLogin() in auth.jsx.
const demoUser = {
  id: 0,
  email: 'demo@example.com',
  name: 'Demo User',
  advertiserId: 1,
  companyName: 'Demo Company',
}

// GET /api/dashboard/stats  ->  { stats: {...} }  (see api/routes/dashboard.ts)
const dashboardStats = {
  stats: {
    total_ads: 28,
    approved_ads: 18,
    denied_ads: 3,
    pending_ads: 6,
    revision_ads: 1,
  },
}

// GET /api/dashboard/recent-activity  ->  { activity: [...] }
// Each row: { id, short_id, ad_copy: { adName }, status, created_at, updated_at, preview_url }
const dashboardRecentActivity = {
  activity: [
    {
      id: 101,
      short_id: 'a1b2c3',
      ad_copy: { adName: 'Summer Sale Banner - 50% Off' },
      status: 'waiting',
      created_at: '2026-06-10T09:00:00Z',
      updated_at: '2026-06-15T14:20:00Z',
      preview_url: 'https://example.com/approve/a1b2c3',
      tracking_id: 'trk_a1b2c3',
    },
    {
      id: 102,
      short_id: 'd4e5f6',
      ad_copy: { adName: 'Product Carousel - Featured Items' },
      status: 'approved',
      created_at: '2026-06-08T09:00:00Z',
      updated_at: '2026-06-14T11:05:00Z',
      preview_url: 'https://example.com/approve/d4e5f6',
      tracking_id: 'trk_d4e5f6',
    },
    {
      id: 103,
      short_id: 'g7h8i9',
      ad_copy: { adName: 'Video Ad - 15 Second Promo' },
      status: 'denied',
      created_at: '2026-06-07T09:00:00Z',
      updated_at: '2026-06-13T16:45:00Z',
      preview_url: null,
      tracking_id: 'trk_g7h8i9',
    },
    {
      id: 104,
      short_id: 'j1k2l3',
      ad_copy: { adName: 'Holiday Special Banner' },
      status: 'in_progress',
      created_at: '2026-06-06T09:00:00Z',
      updated_at: '2026-06-12T10:30:00Z',
      preview_url: 'https://example.com/approve/j1k2l3',
      tracking_id: 'trk_j1k2l3',
    },
    {
      id: 105,
      short_id: 'm4n5o6',
      ad_copy: { adName: 'Brand Story Video' },
      status: 'approved',
      created_at: '2026-06-05T09:00:00Z',
      updated_at: '2026-06-11T08:15:00Z',
      preview_url: null,
      tracking_id: 'trk_m4n5o6',
    },
    {
      id: 106,
      short_id: 'p7q8r9',
      ad_copy: { adName: 'Customer Testimonial Banner' },
      status: 'waiting',
      created_at: '2026-06-04T09:00:00Z',
      updated_at: '2026-06-10T13:50:00Z',
      preview_url: 'https://example.com/approve/p7q8r9',
      tracking_id: 'trk_p7q8r9',
    },
  ],
}

// GET /api/campaigns  ->  { campaigns: [...] } (list view shape, see api/routes/campaigns.ts)
const campaignList = {
  campaigns: mockCampaigns.map((c) => ({
    advertiser_id: 1,
    updated_at: c.created_at,
    ...c,
  })),
}

// GET /api/campaigns/stats  ->  object returned directly (NOT wrapped in { stats })
const campaignStats = {
  total_campaigns: mockCampaigns.length,
  active_campaigns: mockCampaigns.filter((c) => c.status === 'in_progress').length,
  pending_approvals: mockCampaigns.reduce((sum, c) => sum + (c.pending_ads || 0), 0),
  approved_this_month: 12,
}

// GET /api/campaigns/recent  ->  { activity: [...] }
const campaignRecent = {
  activity: dashboardRecentActivity.activity.slice(0, 4).map((a, i) => ({
    id: a.id,
    short_id: a.short_id,
    ad_name: a.ad_copy.adName,
    campaign_name: mockCampaigns[i % mockCampaigns.length].name,
    status: a.status,
    date: a.updated_at,
  })),
}

// GET /api/campaigns/:id  ->  { campaign: { ...campaign, ads: [...] } }
function getCampaignDetail(id) {
  const campaign = mockCampaigns.find((c) => c.id === id)
  if (!campaign) return undefined

  const ads = mockAds
    .filter((a) => a.campaign_id === id)
    .map((a) => ({
      id: a.id,
      short_id: a.short_id,
      ad_copy: { adName: a.name, description: a.description },
      approval_status: a.status,
      created_at: a.created_at,
    }))

  return { campaign: { advertiser_id: 1, updated_at: campaign.created_at, ...campaign, ads } }
}

/**
 * Resolve a demo fixture for a GET endpoint, or return undefined if none applies
 * (mutations and unmapped routes fall through to the real error).
 *
 * @param {string} endpoint - e.g. "/api/dashboard/stats?advertiserId=1"
 * @param {string} method
 * @returns {unknown | undefined}
 */
export function resolveDevFixture(endpoint, method = 'GET') {
  if (method.toUpperCase() !== 'GET') return undefined

  const path = endpoint.split('?')[0]

  switch (path) {
    case '/api/dashboard/stats':
      return dashboardStats
    case '/api/dashboard/recent-activity':
      return dashboardRecentActivity
    case '/api/campaigns':
      return campaignList
    case '/api/campaigns/stats':
      return campaignStats
    case '/api/campaigns/recent':
      return campaignRecent
    case '/api/auth/me':
      return { user: demoUser }
    default:
      break
  }

  const campaignDetail = path.match(/^\/api\/campaigns\/(\d+)$/)
  if (campaignDetail) return getCampaignDetail(Number(campaignDetail[1]))

  return undefined
}
