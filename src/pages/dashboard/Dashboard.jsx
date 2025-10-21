import { useState, useMemo, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import Card, { CardHeader } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import SortableTableHeader from '../../components/ui/SortableTableHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useAuth } from '../../lib/auth'
import { api } from '../../lib/api'

export default function Dashboard() {
  const { user } = useAuth()
  const [sort, setSort] = useState({ key: null, direction: null })
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.advertiserId) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [statsData, activityData] = await Promise.all([
        api.dashboard.getStats(user.advertiserId),
        api.dashboard.getRecentActivity(user.advertiserId),
      ])

      setStats(statsData.stats)
      setActivity(activityData.activity || [])
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const sortedActivity = useMemo(() => {
    if (!sort.key || !sort.direction) return activity

    return [...activity].sort((a, b) => {
      let aValue = a[sort.key]
      let bValue = b[sort.key]

      // Handle date sorting
      if (sort.key === 'date') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
  }, [activity, sort])

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading dashboard..." />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
      </Layout>
    )
  }

  return (
    <Layout>
      <h1 className="meta-page-title">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-sp-4 mb-sp-6">
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {stats?.total_ads || 0}
          </div>
          <div className="stat-label meta-label mt-sp-2">Total Ads</div>
        </Card>
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {stats?.approved_ads || 0}
          </div>
          <div className="stat-label meta-label mt-sp-2">Approved</div>
        </Card>
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {stats?.pending_ads || 0}
          </div>
          <div className="stat-label meta-label mt-sp-2">Pending Approvals</div>
        </Card>
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {stats?.denied_ads || 0}
          </div>
          <div className="stat-label meta-label mt-sp-2">Denied</div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card padding={false}>
        <CardHeader>
          <h2 className="meta-section-title mb-0">Recent Activity</h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="meta-table">
            <thead>
              <tr>
                <SortableTableHeader
                  label="Ad Name"
                  sortKey="ad_name"
                  currentSort={sort}
                  onSort={setSort}
                />
                <SortableTableHeader
                  label="Campaign"
                  sortKey="campaign_name"
                  currentSort={sort}
                  onSort={setSort}
                />
                <SortableTableHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sort}
                  onSort={setSort}
                />
                <SortableTableHeader
                  label="Date"
                  sortKey="date"
                  currentSort={sort}
                  onSort={setSort}
                />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-sp-6 text-text-secondary">
                    No recent activity
                  </td>
                </tr>
              ) : (
                sortedActivity.map((item) => (
                  <tr key={item.id}>
                    <td>{item.ad_copy?.adName || item.short_id || 'Untitled Ad'}</td>
                    <td>—</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{new Date(item.updated_at).toLocaleDateString()}</td>
                    <td>
                      {item.preview_url && (
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => window.open(item.preview_url, '_blank')}
                        >
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}
