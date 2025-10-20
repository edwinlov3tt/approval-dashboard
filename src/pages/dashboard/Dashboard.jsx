import { useState, useMemo } from 'react'
import Layout from '../../components/layout/Layout'
import Card, { CardHeader } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import SortableTableHeader from '../../components/ui/SortableTableHeader'
import { mockDashboardStats, mockRecentActivity } from '../../lib/mockData'

export default function Dashboard() {
  const [sort, setSort] = useState({ key: null, direction: null })

  const sortedActivity = useMemo(() => {
    if (!sort.key || !sort.direction) return mockRecentActivity

    return [...mockRecentActivity].sort((a, b) => {
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
  }, [sort])

  return (
    <Layout>
      <h1 className="meta-page-title">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-sp-4 mb-sp-6">
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {mockDashboardStats.total_campaigns}
          </div>
          <div className="stat-label meta-label mt-sp-2">Total Campaigns</div>
        </Card>
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {mockDashboardStats.active_campaigns}
          </div>
          <div className="stat-label meta-label mt-sp-2">Active Campaigns</div>
        </Card>
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {mockDashboardStats.pending_approvals}
          </div>
          <div className="stat-label meta-label mt-sp-2">Pending Approvals</div>
        </Card>
        <Card>
          <div className="stat-value text-28 font-semibold text-text-primary">
            {mockDashboardStats.approved_this_month}
          </div>
          <div className="stat-label meta-label mt-sp-2">Approved This Month</div>
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
              {sortedActivity.map((item) => (
                <tr key={item.id}>
                  <td>{item.ad_name}</td>
                  <td>{item.campaign_name}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>
                    <Button size="small" variant="secondary">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}
