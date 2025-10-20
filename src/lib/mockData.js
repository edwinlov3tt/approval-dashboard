// Mock Campaigns Data
export const mockCampaigns = [
  {
    id: 1,
    name: 'Summer Sale 2025',
    description: 'Q3 promotional campaign',
    status: 'in_progress',
    start_date: '2025-06-01',
    end_date: '2025-08-31',
    total_ads: 10,
    approved_ads: 6,
    denied_ads: 1,
    pending_ads: 3,
    created_at: '2025-05-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Holiday Campaign',
    description: 'End of year holiday promotions',
    status: 'waiting',
    start_date: '2025-11-01',
    end_date: '2025-12-31',
    total_ads: 5,
    approved_ads: 0,
    denied_ads: 0,
    pending_ads: 5,
    created_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 3,
    name: 'Brand Awareness',
    description: 'Ongoing brand awareness campaign',
    status: 'approved',
    start_date: '2025-09-01',
    end_date: '2025-10-31',
    total_ads: 8,
    approved_ads: 8,
    denied_ads: 0,
    pending_ads: 0,
    created_at: '2025-08-15T10:00:00Z',
  },
  {
    id: 4,
    name: 'Product Recall',
    description: 'Product recall notification campaign',
    status: 'denied',
    start_date: '2025-08-15',
    end_date: '2025-09-30',
    total_ads: 2,
    approved_ads: 0,
    denied_ads: 2,
    pending_ads: 0,
    created_at: '2025-08-01T10:00:00Z',
  },
  {
    id: 5,
    name: 'Spring Launch',
    description: 'New product line launch',
    status: 'waiting',
    start_date: '2026-03-01',
    end_date: '2026-05-31',
    total_ads: 3,
    approved_ads: 0,
    denied_ads: 0,
    pending_ads: 3,
    created_at: '2025-10-10T10:00:00Z',
  },
]

// Mock Ads Data
export const mockAds = [
  {
    id: 42,
    short_id: 'abc123',
    campaign_id: 1,
    name: 'Summer Sale Banner',
    status: 'approved',
    created_at: '2025-05-20T09:00:00Z',
  },
  {
    id: 43,
    short_id: 'def456',
    campaign_id: 1,
    name: 'Product Carousel',
    status: 'waiting',
    created_at: '2025-06-02T09:00:00Z',
  },
  {
    id: 44,
    short_id: 'ghi789',
    campaign_id: 1,
    name: 'Video Ad',
    status: 'denied',
    created_at: '2025-06-03T09:00:00Z',
  },
  {
    id: 45,
    short_id: 'jkl012',
    campaign_id: 2,
    name: 'Holiday Special Banner',
    status: 'waiting',
    created_at: '2025-10-01T09:00:00Z',
  },
]

// Mock Recent Activity
export const mockRecentActivity = [
  {
    id: 1,
    ad_name: 'Summer Sale Banner',
    campaign_name: 'Summer Sale 2025',
    status: 'waiting',
    date: '2025-10-19',
  },
  {
    id: 2,
    ad_name: 'Product Launch Video',
    campaign_name: 'Holiday Campaign',
    status: 'approved',
    date: '2025-10-18',
  },
  {
    id: 3,
    ad_name: 'Social Media Post',
    campaign_name: 'Brand Awareness',
    status: 'denied',
    date: '2025-10-17',
  },
  {
    id: 4,
    ad_name: 'Email Banner',
    campaign_name: 'Summer Sale 2025',
    status: 'approved',
    date: '2025-10-16',
  },
  {
    id: 5,
    ad_name: 'Display Ad',
    campaign_name: 'Holiday Campaign',
    status: 'waiting',
    date: '2025-10-15',
  },
]

// Mock Dashboard Stats
export const mockDashboardStats = {
  total_campaigns: 12,
  active_campaigns: 8,
  pending_approvals: 23,
  approved_this_month: 45,
}

// Mock Calendar Events
export const mockCalendarEvents = [
  {
    id: 'campaign-1',
    type: 'campaign',
    title: 'Summer Sale 2025',
    start: '2025-06-01',
    end: '2025-08-31',
    status: 'in_progress',
  },
  {
    id: 'campaign-2',
    type: 'campaign',
    title: 'Holiday Campaign',
    start: '2025-11-01',
    end: '2025-12-31',
    status: 'waiting',
  },
  {
    id: 'campaign-3',
    type: 'campaign',
    title: 'Brand Awareness',
    start: '2025-09-01',
    end: '2025-10-31',
    status: 'approved',
  },
]

// Mock User Profile
export const mockUserProfile = {
  id: 1,
  first_name: 'John',
  last_name: 'Smith',
  email: 'john@company.com',
  phone: '(555) 123-4567',
  profile_photo_url: null,
  is_on_vacation: false,
}
